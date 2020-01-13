#!/bin/bash

parse_git_branch() {
	node ~/bin/git-info.js
}

export PS1="\n---- \u @ \h \$(git-info) [\t] ---- \n \w $ "
