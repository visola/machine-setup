package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
)

var colorResets = []string{"[0;33;1m", "[0;31;1m", "[0m"}

type LogRecord struct {
	LogLine string `json:"log"`
}

func main() {
	file, err := os.Open(os.Args[1])
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		logRecord := LogRecord{}
		json.Unmarshal([]byte(scanner.Text()), &logRecord)
		txt := logRecord.LogLine
		if txt == "" {
			txt = scanner.Text()
		}

		for _, colorReset := range colorResets {
			index := strings.Index(txt, colorReset)
			if index < 0 {
				continue
			}
			txt = txt[index+len(colorReset):]
		}

		if !strings.HasSuffix(txt, "\n") {
			txt = txt + "\n"
		}
		fmt.Print(txt)
	}

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}
}
