package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"time"

	ui "github.com/gizak/termui/v3"
	"github.com/gizak/termui/v3/widgets"
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

//                                                1   2          3       4     5              6         7
var accessLogPattern = regexp.MustCompile(`.*\[0m(.*) (.*) - - \[(.*)\] "(\w+) (.*) HTTP/.*" (\d{1,3}) (\d+) ".*"`)

func main() {
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
	paragraph.Text = "0"
	paragraph.SetRect(0, 3, 150, 8)
	paragraph.BorderStyle.Fg = ui.ColorWhite
	paragraph.TitleStyle.Fg = ui.ColorCyan

	ui.Render(progressGauge, paragraph)

	client := &http.Client{}
	counter := 0

	go (func() {
		var totalBytesRead int64
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			found := accessLogPattern.FindStringSubmatch(scanner.Text())
			failed := false
			if len(found) == 8 {
				counter++
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

				json, err := json.Marshal(accessLogRecord)
				if err != nil {
					paragraph.Text = fmt.Sprintf("Error %s", err)
					failed = true
				}

				req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("http://localhost:9200/access_log/_doc/%d", counter), bytes.NewBuffer(json))
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
					// return
				}
				resp.Body.Close()
			}

			totalBytesRead += int64(len(scanner.Bytes()))

			progressGauge.Percent = int(100 * totalBytesRead / stat.Size())
			if !failed {
				paragraph.Text = fmt.Sprintf("Documents: %d, Bytes Read/Total: %s / %d", counter, strconv.FormatInt(totalBytesRead, 10), stat.Size())
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
