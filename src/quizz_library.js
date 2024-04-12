/** Quizz library 
 * 
 * This library supports multiple types of quizzes :
 *  - single answer
 *  - multi answer
 *  - with images instead of text
 *  - clickable image
 * 
 * For each, there are usually three functions :
 * 1. A function to build the HTML from the input given in markdown (`build*` functions)
 * 2. Callback functions called when items are clicked
 * 3. A function to submit the user answer
*/


const quizz = {
    // Store all quizz input and results here
    // Not that nothing is persisted between page reloads or navigation
    allQuizzes: new Map(),

    /** Parse a Markdown checklist */
    parseInput : function(input) {
        let lines = input.split("\n")
                    .filter((l) => l)
                    .map((l) => l.trim())
        let choices = []
        for (line of lines) {
            if (line.startsWith("- ")) {
                let choiceStr = line.substring(line.indexOf("- ") + 2).trim()
                let choice = choiceStr.trim()
                if (choice.startsWith("[ ]"))
                    choices.push({ "correct": false, content: choice.substring(4) })
                else if (choice.startsWith("[]"))
                    choices.push({ "correct": false, content: choice.substring(3) })
                else if (choice.startsWith("[x]"))
                    choices.push({ "correct": true, content: choice.substring(4) })
                else
                    console.log("Warning: format not recognized")
            } else if (line.startsWith(">")) {
                // Add hint
                choices[choices.length - 1].hint = line.substring(1).trim()
            }
        }
        return choices
    },

    // Store simple quizz (single answer)
    storeQuizz: function(id, choices) {
        quizz.allQuizzes.set(id, {"choices": choices})
    },


    // Store multi answers quizz
    storeMultiQuizz: function(id, choices) {
        quizz.allQuizzes.set(id, {"choices": choices, "answers": Array()})
    },

    // Called for single answer quizz, when item is clicked
    onChooseSingle: function(quizzId, index) {
        console.log(`Chose answer ${index} ${typeof index} ${quizzId}  ${typeof quizzId} ${quizz.allQuizzes}`)
        // Store choice
        quizz.allQuizzes.get(quizzId).chosenIndex = index
    
        let quizz_div = document.getElementById(`${quizzId}`)
        let items = quizz_div.getElementsByClassName("choice-item")
        for (item of items)
            if (item.classList.contains("choice-item-selected"))
                item.classList.remove("choice-item-selected")
        
        items[index].classList.add("choice-item-selected")
    },
    
    // Called for multi answer quizz, when item is clicked
    onToggleMulti: function(quizzId, index) {
        console.log(`Chose answer ${index}`)
        // Store answer
        let answers = quizz.allQuizzes.get(quizzId).answers
        if (answers.indexOf(index) < 0)
            answers.push(index)
        else
            answers.splice(answers.indexOf(index))
    
        let quizz_div = document.getElementById(`${quizzId}`)
        let items = quizz_div.getElementsByClassName("choice-item")
        
        let classes = items[index].classList
        console.log(classes)
        if (classes.contains("choice-item-selected")) {
            classes.remove("choice-item-selected")
        } else {
            classes.add("choice-item-selected")
        }
    },
    
    // Submit quizz response for single answer quizz
    onSubmitSingle: function(quizzId) {
        let chosenIndex = quizz.allQuizzes.get(quizzId).chosenIndex
        console.log(`Submitting answer ${chosenIndex}`)
        if (chosenIndex < 0 || chosenIndex === undefined) return
        
        let choices = quizz.allQuizzes.get(quizzId).choices
        let correctAnswerIndex = choices.findIndex((c) => c.correct)
        
        let quizz_div = document.getElementById(`${quizzId}`)
        let items = quizz_div.getElementsByClassName("choice-item")
    
        for (item of items)
            item.classList.remove("choice-item-selectable")
    
        items[correctAnswerIndex].classList.add("correct")
    
        if (!choices[chosenIndex].correct)
            items[chosenIndex].classList.add("incorrect")
    
    
        // Show hint if any
        let hint = choices[correctAnswerIndex].hint
        if (hint !== undefined) {
            let item = items[correctAnswerIndex]
            let hintDiv = document.createElement("div")
            hintDiv.className = "quizz-hint"
            hintDiv.appendChild(document.createTextNode(hint))
            item.parentNode.insertBefore(hintDiv, item.nextSibling)
        }
    },
    
    onSubmitMulti: function(quizzId) {
        let answers = quizz.allQuizzes.get(quizzId).answers
        console.log(`Submitting answers ${answers}`)
        
        let choices = quizz.allQuizzes.get(quizzId).choices
        let correct = choices.filter((c) => c.correct).map((c) => choices.indexOf(c))
        console.log("Correct answers: " + correct)
        let quizz_div = document.getElementById(`${quizzId}`)
        let items = quizz_div.getElementsByClassName("choice-item")
    
        for (item of items)
            item.classList.remove("choice-item-selectable")
    
        for (i = 0; i < choices.length; i++) {    
            let isCorrect = correct.indexOf(i) >= 0
            let isSelected = answers.indexOf(i) >= 0
            if (isCorrect && isSelected) {
                items[i].classList.add("correct")
            } else if (isCorrect && !isSelected) {
                items[i].classList.add("missing")
            } else if (!isCorrect && isSelected) {
                items[i].classList.add("incorrect")
            }
    
        }
        
    },
    
    buildSingleChoiceQuizz: function(quizzId, containerElement, choices) {
        console.log("Building single choice quizz with : " + choices)
    
        let listItems = choices.map((choice, index) => 
            `<li onclick="quizz.onChooseSingle(${quizzId}, ${index})" 
                 class="choice-item choice-item-selectable">${choice.content}</li>`
        )
    
        let content = `<ul>\n${listItems.join("\n")}</ul>`
        containerElement.innerHTML = content
    
        let submitButton = document.getElementById(`${quizzId}`).getElementsByClassName("submit-quizz")[0]
        submitButton.onclick = (() => quizz.onSubmitSingle(quizzId) )
    },
    
    buildMultiChoicesQuizz: function(quizzId, containerElement, choices) {
        console.log("Building multi-answer quizz with : " + choices)
    
        let listItems = choices.map((choice, index) => 
            `<li onclick="quizz.onToggleMulti(${quizzId}, ${index})" 
                 class="choice-item choice-item-selectable">${choice.content}</li>`
        )
    
        let content = `<ul>\n${listItems.join("\n")}</ul>`
        containerElement.innerHTML = content
    
        let submitButton = document.getElementById(`${quizzId}`).getElementsByClassName("submit-quizz")[0]
        submitButton.onclick = (() => quizz.onSubmitMulti(quizzId) )
    },
    
    buildImageQuizz: function(quizzId, containerElement, choices) {
        console.log("Building image quizz with : " + choices)
    
        let listItems = choices.map((choice, index) => 
            `<img onclick="quizz.onToggleMulti(${quizzId}, ${index})" 
                  class="choice-item choice-item-selectable" 
                  src="${choice.content}"></img>`
        )
    
        let content = `<div class="image-choice-container">\n${listItems.join("\n")}</div>`
        containerElement.innerHTML = content
    
        let submitButton = document.getElementById(`${quizzId}`).getElementsByClassName("submit-quizz")[0]
        submitButton.onclick = (() => quizz.onSubmitMulti(quizzId) )
    },
    
    register_correct_selections: function(id, n_rows, n_cols, selection_str, hint) {
        console.log("Registering selections for quizz " + id + ": " + selection_str);
        let correct_positions = selection_str.split(";").map(s => {
            let matches = [...s.matchAll(/(\d+),(\d+)/g)][0];
            return [parseInt(matches[1]), parseInt(matches[2])]
        });
        quizz.allQuizzes.set(id, {"correct_positions": correct_positions, "n_rows": n_rows, "n_cols": n_cols});
        if (hint !== undefined && hint !== "") {
            quizz.allQuizzes.get(id).hint = hint
        }
    },
    
    onImageClick: function(div) {
        console.log("Clicked image")
        if (div.classList.contains("selected")) {
            div.classList.remove("selected")
        } else {
            div.classList.add("selected")
        }
    },
    
    checkImageQuizz: function(id) {
        let quizzInfo = quizz.allQuizzes.get(id)
        let rootDiv = document.getElementById(id)
        let parts = rootDiv.getElementsByClassName("image-part")
        for (row = 0; row < quizzInfo.n_rows; row++) {
            for (col = 0; col < quizzInfo.n_cols; col++) {
                let part = parts[col + row * quizzInfo.n_cols]
                let isCorrect = containsArray(quizzInfo.correct_positions, [row, col])
                if (isCorrect) {
                    part.classList.add("correct")
                    console.log("Correct: " + row + "," + col)
                }
                let isSelected = part.classList.contains("selected")
                if (isSelected && !isCorrect) part.classList.add("incorrect")
            }
        }

        // Show hint if any
        let hint = quizzInfo.hint
        if (hint !== undefined) {
            let hintDiv = document.createElement("div")
            hintDiv.className = "quizz-hint"
            hintDiv.appendChild(document.createTextNode(hint))
            let button = rootDiv.parentNode.getElementsByClassName("submit-quizz")[0]
            console.log(rootDiv)
            console.log(button)
            rootDiv.parentNode.insertBefore(hintDiv, button)
        }
    },

    // Ordering list
    parseOrderingListQuizz: function(input) {
        console.log("Building ordered list quizz with : " + input)
        let re = /(\d+). (.*)/;
        console.log(input.split("\n").filter((l) => l).map((l) => l.trim()))
        let res = input.split("\n")
                    .filter((l) => l)
                    .map((l) => l.trim())
                    .map((line) => {
                        let res = line.match(re)
                        return { index: parseInt(res[1]), content: res[2]}
                    });
        return res
    },

    buildOrderingListQuizz: function(quizzId, containerElement, choices) {
        console.log("List choices: " + choices)
        let listItems = choices.map((choice) => 
            `<li class="draggable-item"><p class="content">${choice.content}</p></li>`
        )
        let content = `<ul>\n${listItems.join("\n")}</ul>`
        containerElement.innerHTML = content

        let submitButton = document.getElementById(quizzId).getElementsByClassName("submit-quizz")[0]
        submitButton.onclick = (() => quizz.onSubmitOrderList(quizzId) )
    },

    onSubmitOrderList: function(quizzId) {
        let quizzChoices = quizz.allQuizzes.get(quizzId).choices
        let div = document.getElementById(quizzId)
        let items = div.getElementsByTagName("li")

        for (var index = 0; index < items.length; index++) {
            let item = items[index]
            let itemContent = item.getElementsByClassName("content")[0].innerHTML
            let choice = quizzChoices.filter((choice) => choice.content === itemContent)[0]
            let expectedIndex = choice.index

            if (expectedIndex === index + 1) {
                item.classList.add("correct")
            } else {
                item.classList.add("incorrect")
            }

            item.innerHTML = `${expectedIndex}. <p class="content">${itemContent}</p>`
        }
    }

}

function containsArray(array, item) {
    for (i of array) {
        if ((i.length === item.length) && i.every((x, index) => x === item[index])) {
            return true
        }
    }
    return false
}





