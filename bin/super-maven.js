const fs = require('fs');
const { spawn } = require('child_process');
const readline = require('readline');
const xmlParser = require('xml2json');
const crypto = require('crypto');
const os = require('os');

const CACHE_DIR = `${os.homedir()}/.super_maven`;

const startTreeGoalRegexp = /maven-dependency-plugin:.*:tree.*@ (.*) ---/;
const dependencyRegexp = /\[INFO] ((\|  |   |\+-|\\-)+) (.*):(compile|impor|provided|runtime|system|test)/;
const taskNameRegexp = /\[INFO] --- (.+):(.+):(.+) \((.+)\) @ (.+) ---/;

const calculateDependencies = (projects) => {
  const projectsByArtifactId = {};

  projects.forEach((p) => {
    projectsByArtifactId[p.artifactId] = p;
  });

  return new Promise((resolve) => {
    runMavenCommand(['dependency:tree'])
      .then((output) => {
        let currentProject = null;
        output.split("\n").forEach((line) => {
          let match = line.match(startTreeGoalRegexp);
            if (match) {
              const name = match[1];
              currentProject = projectsByArtifactId[name];
            }

            match = line.match(dependencyRegexp);
            if (match) {
              const artifact = match[3].split(":");
              currentProject.dependencies.push({
                id: `${artifact[0]}:${artifact[1]}`,
                artifactId: artifact[1],
                groupId: artifact[0],
                level: match[1].split(" ").filter((s) => s != "").length,
                scope: match[4],
                type: artifact[2],
                version: artifact[3],
              });
            }
        });

        resolve(projects);
      });
  });
};

const findProjects = (baseDir) => {
  let text = `\r\x1b[KReading directory: ${baseDir}`;
  if (process.stdout.columns && process.stdout.columns < text.length) {
    text = text.substr(0, process.stdout.columns - 3) + '...';
  }
  process.stdout.write(text);
  const projects = [];
  if (!baseDir.endsWith("/")) {
    baseDir = `${baseDir}/`;
  }

  if (isProject(baseDir)) {
    projects.push(getProjectInfo(baseDir));
  }

  fs.readdirSync(baseDir).forEach((file) => {
    const newPath = `${baseDir}${file}`;
    if (fs.lstatSync(newPath).isDirectory()) {
      projects.push(...findProjects(newPath));
    }
  });

  return projects;
}

const findProjectsWithDependencies = (baseDir) => {
  const fromCache = loadFromCache(baseDir);
  if (fromCache) {
    return Promise.resolve(fromCache);
  }

  const projects = findProjects(baseDir);
  process.stdout.write(`\r\x1b[KProjects found: ${projects.length}\n`);
  return calculateDependencies(projects)
    .then((projects) => {
      saveToCache(baseDir, projects);
      return projects;
    });
}

const getArtifactInfoFromPom = (pom, parent) => {
  const project = pom.project;
  return {
    artifactId: project.artifactId,
    groupId: project.groupId || parent.groupId,
    name: project.name,
    version: project.version || parent.version,
    type: project.packaging || "jar",
  }
}

const getParentFromPom = (pom) => {
  const parent = pom.project.parent;
  if (!parent) {
    return {};
  }

  return {
    artifactId: parent.artifactId,
    groupId: parent.groupId,
    version: parent.version,
  };
}

const getProjectInfo = (baseDir) => {
  const pathToPom = `${baseDir}pom.xml`;
  const pomContent = fs.readFileSync(pathToPom, "utf8");
  const parsedPom = JSON.parse(xmlParser.toJson(pomContent));

  const parent = getParentFromPom(parsedPom);
  const artifact = getArtifactInfoFromPom(parsedPom, parent);

  return Object.assign(artifact, {
    dependencies: [],
    id: `${artifact.groupId}:${artifact.artifactId}`,
    parent,
    path: baseDir,
    pom: pathToPom,
  });
}

const isProject = (baseDir) => {
  try {
    fs.accessSync(`${baseDir}pom.xml`);
    return true;
  } catch (e) {
    return false;
  }
}

const loadFromCache = (baseDir) => {
  try {
    const hash = crypto.createHmac('sha256', baseDir).digest('hex');
    return JSON.parse(fs.readFileSync(`${CACHE_DIR}/${hash}.json`));
  } catch (e) {
    return null;
  }
}

const runMavenCommand = (args) => {
  const start = Date.now();
  return new Promise((resolve) => {
    const mavenProcess = spawn("mvn", args);
    let output = "";

    const timer = setInterval(() => {
      let taskInfo = null;
      if (output != "") {
        const split = output.split("\n").filter((l) => l != '');
        for (let n = split.length - 1; n >= 0; n--) {
          const match = split[n].match(taskNameRegexp);
          if (match) {
            taskInfo = {
              plugin: match[1],
              task: match[3],
              project: match[5],
            };
            break;
          }
        }
      }

      let time = Math.round( (Date.now() - start) / 100) / 10 + '';
      if (time.indexOf(".") < 0) {
        time += '.0';
      }

      if (taskInfo == null) {
        process.stdout.write(`\r\x1b[KRunning maven ${time}s: Initializing...`);
      } else {
        process.stdout.write(`\r\x1b[KRunning \x1b[36m${taskInfo.plugin}:${taskInfo.task}\x1b[0m in project \x1b[36m${taskInfo.project}\x1b[0m (${time}s)`);
      }

    }, 200);

    mavenProcess.stdout.on('data', (chunk) => {
      const data = chunk.toString('utf8');
      output += data;
    });

    mavenProcess.on('exit', (code, signal) => {
      clearInterval(timer);
      process.stdout.write('\r\x1b[K');
      resolve(output);
    });
  });
};

const saveToCache = (baseDir, projects) => {
  try {
    const hash = crypto.createHmac('sha256', baseDir).digest('hex');
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR);
    }
    return fs.writeFileSync(`${CACHE_DIR}/${hash}.json`, JSON.stringify(projects));
  } catch (e) {
    return null;
  }
}

// ----- MAIN ------

const projectId = process.argv[2];
const args = process.argv.slice(3);
console.log(`Project ${projectId}, args: ${args}`);

const start = Date.now();
findProjectsWithDependencies(process.cwd())
  .then((projects) => {
    const project = projects.find((p) => p.id.indexOf(projectId) >= 0);
    if (project == null) {
      console.log(`Project not found: ${projectId}.`);
      process.exit(-1);
      return;
    }

    const projectsByArtifactId = {};

    projects.forEach((p) => {
      projectsByArtifactId[p.id] = p;
    });

    const internalDependencies = project.dependencies
      .map((d) => projectsByArtifactId[d.id])
      .filter((p) =>  p != null);
    console.log(`Found project: ${project.id}, it has ${project.dependencies.length} dependencies, ${internalDependencies.length} internal dependencies`);

    const toBuild = [project, ...internalDependencies];
    const projectList = toBuild.map((p) => p.id).join(',');

    return runMavenCommand(['-pl', projectList, ...args]);
  }).then((output) => {
    console.log(output);
    console.log(`Finished in ${Date.now() - start}ms`);
  });;
