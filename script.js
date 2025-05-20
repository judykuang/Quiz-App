const setupScreen = document.getElementById("setup-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultsScreen = document.getElementById("results-screen");
const categorySelect = document.getElementById("category-select");
const difficultySelect = document.getElementById("difficulty-select");
const questionsNumber = document.getElementById("questions-number");
const startBtn = document.getElementById("start-btn");
const questionElement = document.getElementById("question");
const answerButtons = document.getElementById("answer-buttons");
const nextButton = document.getElementById("next-btn");
const questionCounter = document.getElementById("question-counter");
const scoreCounter = document.getElementById("score-counter");
const finalScore = document.getElementById("final-score");
const playAgainBtn = document.getElementById("play-again-btn");
const loadingSpinner = document.getElementById("loading");
const errorMessage = document.getElementById("error-message");

// Quiz state
let currentQuestionIndex = 0;
let score = 0;
let questions = [];

startBtn.addEventListener("click", fetchQuestions);
nextButton.addEventListener("click", handleNextButton);
playAgainBtn.addEventListener("click", resetQuiz);

const triviaCategoryIds = {
    "9": "General Knowledge",
    "10": "Books",
    "11": "Films",
    "14": "Television",
    "15": "Video Games",  
    "17": "Science & Nature",
    "18": "Computers",
    "19": "Mathematics",
    "21": "Sports",
    "22": "Geography",
    "23": "History",
    "25": "Art",
    "26": "Celebrities",
    "27": "Animals",
    "31": "Anime & Manga"
};

// Default example questions for fallback
const defaultQuestions = [
    {
        question: "Which is the largest animal in the world?",
        answers: [
            {text: "Shark", correct: false},
            {text: "Blue Whale", correct: true},
            {text: "Elephant", correct: false},
            {text: "Giraffe", correct: false},
        ]
    },
    {
        question: "Which is the smallest country in the world?",
        answers: [
            {text: "Vatican City", correct: true},
            {text: "Bhutan", correct: false},
            {text: "Nepal", correct: false},
            {text: "Shri Lanka", correct: false},
        ]
    },
    {
        question: "Which is the largest desert in the world?",
        answers: [
            {text: "Kalahari", correct: false},
            {text: "Gobi", correct: false},
            {text: "Sahara", correct: false},
            {text: "Antarctica", correct: true},
        ]
    },
    {
        question: "Which is the smallest continent in the world?",
        answers: [
            {text: "Asia", correct: false},
            {text: "Australia", correct: true},
            {text: "Arctic", correct: false},
            {text: "Africa", correct: false},
        ]
    }
];

/**
 * Fetches questions from Open Trivia DB based on user selection
 */
async function fetchQuestions() {
    errorMessage.textContent = "";
    const category = categorySelect.value;
    const difficulty = difficultySelect.value;
    const amount = parseInt(questionsNumber.value);
    
    if (amount < 1 || amount > 20) {
        errorMessage.textContent = "Please select between 1 and 20 questions.";
        return;
    }
    
    loadingSpinner.style.display = "block";
    startBtn.disabled = true;
    
    try {
        let categoryId = category;
        if (category && category.startsWith('trivia:')) {
            categoryId = category.split(':')[1];
        }
        
        console.log("Fetching from Open Trivia DB with category:", categoryId);
        
        questions = await fetchTriviaDB(categoryId, difficulty, amount);
        
        // If we got questions, start the quiz
        if (questions.length > 0) {
            startQuiz();
        } else {
            throw new Error("No questions available");
        }
    } catch (error) {
        console.error("Error fetching questions:", error);
        errorMessage.textContent = `Failed to load questions: ${error.message}. Using default questions instead.`;
        questions = defaultQuestions.slice(0, amount);
        startQuiz();
    } finally {
        loadingSpinner.style.display = "none";
        startBtn.disabled = false;
    }
}

/**
 * Fetches questions from Open Trivia Database
 */
async function fetchTriviaDB(categoryId, difficulty, amount) {
    try {
        let url = `https://opentdb.com/api.php?amount=${amount}&type=multiple`;
        
        if (categoryId && categoryId !== "") {
            url += `&category=${categoryId}`;
        }
        
        if (difficulty && difficulty !== "") {
            url += `&difficulty=${difficulty.toLowerCase()}`;
        }
        
        console.log("Fetching from Open Trivia DB with URL:", url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`OpenTDB error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("OpenTDB response:", data);
        
        // Check OpenTDB response codes
        // 0: Success, 1: No Results, 2: Invalid Parameter, 3: Token Not Found, 4: Token Empty
        if (data.response_code !== 0) {
            let errorMsg = "Error fetching from Open Trivia DB";
            
            switch(data.response_code) {
                case 1:
                    errorMsg = "No results found for these criteria. Try different options.";
                    break;
                case 2:
                    errorMsg = "Invalid parameters sent to Open Trivia DB.";
                    break;
                case 3:
                case 4:
                    errorMsg = "Session token issue with Open Trivia DB.";
                    break;
            }
            
            throw new Error(errorMsg);
        }
        
        if (!data.results || data.results.length === 0) {
            throw new Error("No questions returned from Open Trivia DB");
        }
        
        // Format Open Trivia DB questions to match our quiz format
        return data.results.map(q => {
            // Combine correct and incorrect answers
            const answers = [
                { text: q.correct_answer, correct: true },
                ...q.incorrect_answers.map(answer => ({ text: answer, correct: false }))
            ];
            
            // Shuffle answers
            shuffleArray(answers);
            
            return {
                question: decodeHTML(q.question),
                answers: answers,
                category: q.category,
                difficulty: q.difficulty,
                source: "Open Trivia DB"
            };
        });
    } catch (error) {
        console.error("Error in fetchTriviaDB:", error);
        throw new Error(`OpenTDB error: ${error.message}`);
    }
}

/**
 * Starts the quiz with fetched questions
 */
function startQuiz() {
    // Double check we have questions
    if (!questions || questions.length === 0) {
        errorMessage.textContent = "No questions available. Please try different options.";
        return;
    }
    
    setupScreen.style.display = "none";
    quizScreen.style.display = "block";
    resultsScreen.style.display = "none";
    
    currentQuestionIndex = 0;
    score = 0;
    nextButton.innerHTML = "Next";
    nextButton.style.display = "none";
    
    updateScoreCounter();
    showQuestion();
}

/**
 * Displays the current question and answers
 */
function showQuestion() {
    resetState();
    let currentQuestion = questions[currentQuestionIndex];
    let questionNo = currentQuestionIndex + 1;
    
    // Update question counter
    questionCounter.textContent = `Question ${questionNo}/${questions.length}`;
    
    // Set question text
    questionElement.innerHTML = currentQuestion.question;
    
    // Create answer buttons
    currentQuestion.answers.forEach(answer => {
        const button = document.createElement("button");
        button.innerHTML = decodeHTML(answer.text);
        button.classList.add("btn");
        answerButtons.appendChild(button);
        if (answer.correct) {
            button.dataset.correct = answer.correct;
        }
        button.addEventListener("click", selectAnswer);
    });
}

/**
 * Resets the quiz state between questions
 */
function resetState() {
    nextButton.style.display = "none";
    while (answerButtons.firstChild) {
        answerButtons.removeChild(answerButtons.firstChild);
    }
}

/**
 * Handles answer selection
 */
function selectAnswer(e) {
    const selectedBtn = e.target;
    const isCorrect = selectedBtn.dataset.correct === "true";
    
    if (isCorrect) {
        selectedBtn.classList.add("correct");
        score++;
        updateScoreCounter();
    } else {
        selectedBtn.classList.add("incorrect");
    }
    
    // Highlight correct answer and disable all buttons
    Array.from(answerButtons.children).forEach(button => {
        if (button.dataset.correct === "true") {
            button.classList.add("correct");
        }
        button.disabled = true;
    });
    
    nextButton.style.display = "block";
}

function updateScoreCounter() {
    scoreCounter.textContent = `Score: ${score}`;
}

/**
 * Shows final score and results screen
 */
function showScore() {
    quizScreen.style.display = "none";
    resultsScreen.style.display = "block";
    finalScore.innerHTML = `You scored ${score} out of ${questions.length}!`;
    playAgainBtn.style.display = "block";
}

/**
 * Handles next button clicks
 */
function handleNextButton() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        showQuestion();
    } else {
        showScore();
    }
}

/**
 * Resets the quiz to the setup screen
 */
function resetQuiz() {
    resultsScreen.style.display = "none";
    setupScreen.style.display = "block";
    errorMessage.textContent = "";
}

/**
 * To shuffle array elements
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function decodeHTML(html) {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

// Modal logic
const aboutLink = document.getElementById("about-link");
const aboutModal = document.getElementById("about-modal");
const closeModal = document.getElementById("close-modal");

aboutLink.addEventListener("click", function (e) {
  e.preventDefault();
  aboutModal.style.display = "block";
});

closeModal.addEventListener("click", function () {
  aboutModal.style.display = "none";
});

window.addEventListener("click", function (e) {
  if (e.target === aboutModal) {
    aboutModal.style.display = "none";
  }
});

// Placeholder resetQuiz function (replace with your actual one)
function resetQuiz() {
  location.reload(); // Or implement actual reset logic
}

const themeToggleBtn = document.getElementById("toggle-theme");

// Apply saved theme on load
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    document.body.classList.add(savedTheme);
    themeToggleBtn.textContent = savedTheme === "dark-mode" ? "🌞" : "🌙";
} else {
    document.body.classList.add("light-mode"); // default
}

// Toggle theme on click
themeToggleBtn.addEventListener("click", () => {
    if (document.body.classList.contains("dark-mode")) {
        document.body.classList.replace("dark-mode", "light-mode");
        themeToggleBtn.textContent = "🌙";
        localStorage.setItem("theme", "light-mode");
    } else {
        document.body.classList.replace("light-mode", "dark-mode");
        themeToggleBtn.textContent = "🌞";
        localStorage.setItem("theme", "dark-mode");
    }
});
