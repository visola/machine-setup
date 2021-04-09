package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
)

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
		split := strings.SplitN(logRecord.LogLine, "|", 2)
		if len(split) == 2 {
			fmt.Println(split[1])
		} else {
			fmt.Println(logRecord.LogLine)
		}
	}

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}
}
