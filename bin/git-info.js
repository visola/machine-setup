var spawn = require('child_process').spawn;

/* No changes:
On branch feature/SURV-970-add-peer-benchmarks-to-reports
Your branch is up-to-date with 'origin/feature/SURV-970-add-peer-benchmarks-to-reports'.
nothing to commit, working tree clean

 * With Changes:
On branch webhook-server-experimental
Changes to be committed:
 (use "git reset HEAD <file>..." to unstage)

	renamed:    samples/ActionFormCallbackServer/src/main/java/com/hubspot/integrations/platform/callbacksample/Field.java -> samples/ActionFormCallbackServer/src/main/java/com/hubspot/integrations/platform/callbacksample/Field2.java
	deleted:    samples/ActionFormCallbackServer/src/main/java/com/hubspot/integrations/platform/callbacksample/Option.java

Changes not staged for commit:
 (use "git add <file>..." to update what will be committed)
 (use "git checkout -- <file>..." to discard changes in working directory)

	modified:   samples/ActionFormCallbackServer/src/main/java/com/hubspot/integrations/platform/callbacksample/CallbackController.java
	modified:   samples/ActionFormCallbackServer/src/main/java/com/hubspot/integrations/platform/callbacksample/Field2.java
	modified:   samples/ActionFormCallbackServer/src/main/java/com/hubspot/integrations/platform/callbacksample/Hex.java
*/

var status = spawn("git", ['status']);
function matchOrZero(str, regex) {
  var match = str.match(regex);
  if (match) return match.length;
  return 0;
}

function calculateUntracked(input) {
  var i,
    untrackedFound = false,
    totalFound = 0,
    split = input.split("\n");
  for (i = 0; i < split.length; i++) {
    if (split[i] == "Untracked files:") {
      untrackedFound = true;
      i += 3;
      while (split[i] != '') {
        totalFound++;
        i++;
      }
      break;
    }
  }
  return totalFound;
}

function printBranchStatus(statusOutput) {
  var branch = /On branch (.*)/g.exec(statusOutput)[1],
    isClean = statusOutput.indexOf('nothing to commit') >= 0,
    untrackedFiles = calculateUntracked(statusOutput),
    deleted = matchOrZero(statusOutput, /(deleted:)/g),
    modified = matchOrZero(statusOutput, /(modified:)/g),
    renamed = matchOrZero(statusOutput, /(renamed:)/g),
    newFiles = matchOrZero(statusOutput, /(new file:)/g)
    output = '\033[1;33m'+branch+'\033[0m';

  if (isClean) {
    output+= ' \033[0;32m(\u2714 clean)\033[0m';
  } else {
    output += ' \033[0;31m('
    if (untrackedFiles > 0) {
      output+= (untrackedFiles) + ' UNTRACKED';
    }
    if (deleted > 0) {
      if (untrackedFiles > 0) output+= ' ';
      output+= deleted + ' DELETED'
    }
    if (modified > 0) {
      if (untrackedFiles > 0 || deleted > 0) output+= ' ';
      output+= modified + ' MODIFIED'
    }
    if (renamed > 0) {
      if (untrackedFiles > 0 || deleted > 0 || modified > 0) output+= ' ';
      output+= renamed + ' RENAMED'
    }
    if (newFiles > 0) {
      if (untrackedFiles > 0 || deleted > 0 || modified > 0 || renamed > 0) output+= ' ';
      output+= newFiles + ' NEW'
    }
    output += ')\033[0m'
  }

  console.log(output);
}

var statusOutput = '';
status.stdout.on('data', function (data) {
  statusOutput += data;
});

status.on('close', function () {
  if (statusOutput.length == 0) return;

  var branchRegexp = /On branch (.*)/g;

  if (branchRegexp.exec(statusOutput) == null) {
    console.log("\033[0;31m(Not in a branch)\033[0m");
  } else {
    printBranchStatus(statusOutput);
  }
});
