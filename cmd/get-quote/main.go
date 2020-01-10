package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"
)

type quoteResponse struct {
	Author string `json:"quoteAuthor"`
	Text   string `json:"quoteText"`
}

func main() {
	dataChannel := make(chan quoteResponse)
	errorChannel := make(chan error)

	go fetchQuote(dataChannel, errorChannel)

	select {
	case response := <-dataChannel:
		if response.Text == "" {
			fmt.Println("Sorry, no quotes for you.")
			return
		}

		fmt.Printf("\"%s\"\n", response.Text)

		if response.Author != "" {
			toRepeat := len(response.Text) - 10
			if toRepeat <= 0 {
				toRepeat = 5
			}
			fmt.Printf("%s- %s\n", strings.Repeat(" ", toRepeat), response.Author)
		}
	case err := <-errorChannel:
		fmt.Println(err.Error())
	case <-time.After(1 * time.Second):
		fmt.Println("Timed out.")
	}
}

func fetchQuote(dataChannel chan quoteResponse, errorChannel chan error) {
	var response quoteResponse

	resp, err := http.Get("http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en")
	if err != nil {
		errorChannel <- err
		return
	}

	if resp.StatusCode != http.StatusOK {
		errorChannel <- fmt.Errorf("Error while fetching query: %s", resp.Status)
		return
	}

	bodyBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		errorChannel <- err
	}

	json.Unmarshal(bodyBytes, &response)
	dataChannel <- response
}
