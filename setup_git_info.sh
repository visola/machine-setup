#!/bin/bash

parse_git_branch() {
	node ~/bin/git-info.js
}

export PS1="\n---- \u @ \h \$(parse_git_branch) [\t] ---- \n \w $ "
