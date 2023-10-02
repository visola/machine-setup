package main

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	ui "github.com/gizak/termui/v3"
	"github.com/gizak/termui/v3/widgets"
	"gopkg.in/yaml.v2"
)

type AccessLogRecord struct {
	Domain    string
	Duration  int
	HappendAt string
	Method    string
	Origin    string
	Path      string
	Status    int
}

type Config struct {
	Domains []string
	After   string
}

//                                           1   2          3       4     5              6         7
var accessLogPattern = regexp.MustCompile(`(.*) (.*) - - \[(.*)\] "(\w+) (.*) HTTP/.*" (\d{1,3}) (\d+) ".*"`)

func main() {
	config := readConfiguration(os.Args[2])

	startAtByte := 0
	if len(os.Args) == 4 {
		startAtByte, _ = strconv.Atoi(os.Args[3])
	}

	file, openErr := os.Open(os.Args[1])
	if openErr != nil {
		log.Print(openErr)
		return
	}
	defer file.Close()

	stat, statErr := file.Stat()
	if statErr != nil {
		log.Print(statErr)
		return
	}

	file.Seek(int64(startAtByte), 0)

	if err := ui.Init(); err != nil {
		log.Printf("failed to initialize termui: %v", err)
		return
	}
	defer ui.Close()

	progressGauge := widgets.NewGauge()
	progressGauge.Title = "Read Progress"
	progressGauge.SetRect(0, 0, 150, 3)
	progressGauge.Percent = 0
	progressGauge.BarColor = ui.ColorRed
	progressGauge.BorderStyle.Fg = ui.ColorWhite
	progressGauge.TitleStyle.Fg = ui.ColorCyan

	paragraph := widgets.NewParagraph()
	paragraph.Title = "Status"
	paragraph.Text = "Test"
	paragraph.SetRect(0, 3, 150, 8)
	paragraph.BorderStyle.Fg = ui.ColorWhite
	paragraph.TitleStyle.Fg = ui.ColorCyan

	ui.Render(progressGauge, paragraph)
	time.Sleep(10000)

	client := &http.Client{}
	counter := 0
	totalCounter := 0

	go (func() {
		totalBytesRead := int64(startAtByte)
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			totalCounter += 1
			found := accessLogPattern.FindStringSubmatch(scanner.Text())
			failed := false
			if len(found) == 8 {
				happendAt, parseErr := time.Parse("02/Jan/2006:15:04:05 -0700", found[3])
				if parseErr != nil {
					paragraph.Text = fmt.Sprintf("Error %s", parseErr)
					failed = true
				}

				duration, _ := strconv.Atoi(found[7])
				status, _ := strconv.Atoi(found[6])

				accessLogRecord := AccessLogRecord{
					Domain:    found[1],
					Duration:  duration,
					HappendAt: happendAt.Format("2006-01-02T15:04:05Z"),
					Method:    found[4],
					Origin:    found[2],
					Path:      found[5],
					Status:    status,
				}

				if isValid(accessLogRecord, config) {
					counter++
					json, err := json.Marshal(accessLogRecord)
					if err != nil {
						paragraph.Text = fmt.Sprintf("Error %s", err)
						failed = true
					}

					id := getId(accessLogRecord)
					req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("http://localhost:9200/access_log/_doc/%s", id), bytes.NewBuffer(json))
					if err != nil {
						paragraph.Text = fmt.Sprintf("Error %s", err)
						failed = true
					}

					req.Header.Set("Content-Type", "application/json; charset=utf-8")
					resp, err := client.Do(req)
					if err != nil {
						paragraph.Text = fmt.Sprintf("Error %s", err)
						failed = true
					}

					if !failed && resp.StatusCode >= 400 {
						bodyBytes, _ := ioutil.ReadAll(resp.Body)
						paragraph.Text = fmt.Sprintf("Failed to PUT request, %d: %s: %s", resp.StatusCode, resp.Status, string(bodyBytes))
						failed = true
					}
					resp.Body.Close()
				}
			}

			totalBytesRead += int64(len(scanner.Bytes()))

			progressGauge.Percent = int(100 * totalBytesRead / stat.Size())
			if !failed {
				paragraph.Text = fmt.Sprintf(
					"Total: %d, Documents: %d, Percent: %d%%, Bytes Read/Total: %s / %d",
					totalCounter,
					counter,
					100*counter/totalCounter,
					strconv.FormatInt(totalBytesRead, 10), stat.Size(),
				)
			}
			ui.Render(progressGauge, paragraph)
		}

		progressGauge.Percent = 100
		ui.Render(progressGauge, paragraph)
	})()

	uiEvents := ui.PollEvents()
	for {
		e := <-uiEvents
		switch e.ID {
		case "q", "<C-c>":
			return
		}
	}
}

func getId(accesslogRecord AccessLogRecord) string {
	bytes := []byte(accesslogRecord.Domain + accesslogRecord.Path + accesslogRecord.HappendAt)
	return fmt.Sprintf("%x", sha256.Sum256(bytes))
}

func isValid(record AccessLogRecord, config Config) bool {
	return validDomain(record.Domain, config.Domains) && record.HappendAt > config.After
}

func readConfiguration(fileName string) Config {
	file, openErr := os.Open(fileName)
	if openErr != nil {
		log.Fatal(openErr)
	}
	defer file.Close()

	data, err := ioutil.ReadAll(file)
	if err != nil {
		log.Fatal(err)
	}

	var config Config
	if err := yaml.Unmarshal(data, &config); err != nil {
		log.Fatal(err)
	}

	return config
}

func validDomain(toCheck string, domains []string) bool {
	for _, domain := range domains {
		if strings.HasSuffix(toCheck, domain) {
			return true
		}
	}
	return false
}
