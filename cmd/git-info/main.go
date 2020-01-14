package main

import (
	"fmt"
	"os/exec"
	"regexp"
	"strings"

	"github.com/labstack/gommon/color"
)

func main() {
	color.Enable()

	matchBranchLine := regexp.MustCompile("On branch (.*)")

	cmd := exec.Command("git", "status")
	stdoutStderr, err := cmd.CombinedOutput()
	if err != nil {
		return
	}

	branch := ""
	status := make([]string, 0)

	mapOfStatuses := map[string]int{
		"deleted":  0,
		"modified": 0,
		"renamed":  0,
		"new file": 0,
	}

	lines := strings.Split(string(stdoutStderr), "\n")
	for _, line := range lines {
		matches := matchBranchLine.FindStringSubmatch(line)
		if len(matches) > 0 {
			branch = color.Yellow(matches[1])
		}

		line = strings.TrimSpace(line)

		if line == "Untracked files:" {
			status = append(status, "UNTRACKED FILES")
		}

		for prefix, count := range mapOfStatuses {
			if strings.HasPrefix(line, prefix) {
				mapOfStatuses[prefix] = count + 1
			}
		}
	}

	for prefix, count := range mapOfStatuses {
		if count == 0 {
			continue
		}
		status = append(status, fmt.Sprintf("%d %s", count, strings.ToUpper(prefix)))
	}

	if len(status) == 0 {
		fmt.Printf("%s %s", branch, color.Green("(clean)"))
		return
	}

	fmt.Printf("%s %s", branch, color.Red(fmt.Sprintf("(%s)", strings.Join(status, ", "))))
}
