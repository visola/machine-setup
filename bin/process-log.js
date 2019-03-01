/* This log processor is specificaly looking for Java exception. It will search and group them
 * by type.
 */
const fs = require('fs');
const readLine = require('readline');
const program = require('commander');

program
  .version('0.0.1')
  .usage('[options] <file ...>')
  .option('-d, --details', 'Print all details about the exceptions found')
  .parse(process.argv)

const files = program.args

if (files.length === 0) {
  console.log('No log files to process.');
  program.outputHelp();
  process.exit(1);
}

const exceptions = {}

const atLineRegExp = /\sat/;
const causedByLineRegExp = /^Caused by:/;
const exceptionLineRegExp = /^(\w+\.)+[\w\$]+Exception/;
const omittedFramesLineRegExp = /^\s+... \d+ common frames omitted/;

const isLineFromException = (line) => {
  return atLineRegExp.exec(line)
    || causedByLineRegExp.exec(line)
    || omittedFramesLineRegExp.exec(line);
}

process.on('exit', () => {
  let total = 0;

  for(const type in exceptions) {
    const exception = exceptions[type];
    total+= exception.count;
    console.log(`${type} - ${exception.count}`);

    if (program.details) {
      console.log("\tMessages:");
      exception.all.forEach((instance) => {
        console.log(`\t\t${instance.file}:${instance.line} -> '${instance.message}'`);
      });
    }
  }
  console.log(`Total: ${total}`);
});

files.forEach((fileName) => {
  if (!fs.existsSync(fileName)) {
    console.log(`File not found: ${fileName}`);
    process.exit(2);
  }

  const fileLines = readLine.createInterface({
    input : fs.createReadStream(fileName),
    terminal: false,
  });

  let lineCount = 0
  let exception = null
  fileLines.on('line', (line) => {
    lineCount++;
    if(exception && !isLineFromException(line)) {
      exception = null
      return;
    }

    if (exceptionLineRegExp.exec(line) && !isLineFromException(line)) {
      split = line.split(':');
      message = split.slice(1).join(':') || '';
      type = split[0];
      exception = {
        file: fileName,
        line: lineCount,
        message: message.substr(1),
        type: type,
      };

      exceptions[type] = exceptions[exception.type] || {count:0, all:[]};
      exceptions[type].count++;
      exceptions[type].all.push(exception);
    }
  });
});
