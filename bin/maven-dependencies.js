const fs = require('fs');
const readline = require('readline');

const file = process.argv[2] || "dependencies.txt";
console.log(`Reading dependencies file: ${file}`);

const lineReader = readline.createInterface({
  input: fs.createReadStream(process.argv[2])
});

const projects = [];
const names = new Set();
const start = Date.now();
let currentProject = null;

const startTreeGoalRegexp = /maven-dependency-plugin:.*:tree.*@ (.*) ---/;
const dependencyRegexp = /\[INFO] ((\|  |   |\+-|\\-)+) (.*):(compile|impor|provided|runtime|system|test)/;

lineReader.on('line', function (line) {
  let match = line.match(startTreeGoalRegexp);
  if (match) {
    const name = match[1];
    names.add(name);
    currentProject = {name, dependencies:[]};
    projects.push(currentProject);
  }

  match = line.match(dependencyRegexp);
  if (match) {
    const artifact = match[3].split(":");
    currentProject.dependencies.push({
      artifact: artifact[1],
      group: artifact[0],
      version: artifact[2],
      level: match[1].split(" ").filter((s) => s != "").length,
      scope: match[4],
    });
  }
});

lineReader.on('close', () => {
  projects.sort((p1, p2) => {
    return p1.dependencies.length - p2.dependencies.length;
  });

  projects.forEach((p) => {
    console.log(`Project: ${p.name}`);
    p.dependencies.forEach((d) => {
      if (names.has(d.artifact)) {
        console.log(`\t- ${JSON.stringify(d)}`);
      }
    });
  });

  const end = Date.now();
  console.log(`Finished in: ${end - start}ms`);
});
