// Data for the vocabulary words
        let dailyWords = [];
        let completedWordsCount = 0;
        let correctAnswers = 0;
        let currentWordIndex = 0;
        let timerInterval;

        // Function to fetch words from verb.json
        async function fetchWords() {
            try {
                const response = await fetch('verb.json');
                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error fetching words:', error);
                // Fallback data in case verb.json is not available
                return [
                    { present: "be (is, am, are)", past: "was, were", past_participle: "been", thai_meaning: "เป็น, อยู่, คือ" },
                    { present: "go", past: "went", past_participle: "gone", thai_meaning: "ไป" },
                    { present: "make", past: "made", past_participle: "made", thai_meaning: "ทำ, สร้าง" },
                    { present: "take", past: "took", past_participle: "taken", thai_meaning: "เอาไป" },
                    { present: "come", past: "came", past_participle: "come", thai_meaning: "มา" },
                    { present: "see", past: "saw", past_participle: "seen", thai_meaning: "เห็น" },
                    { present: "know", past: "knew", past_participle: "known", thai_meaning: "รู้, รู้จัก" },
                    { present: "get", past: "got", past_participle: "gotten, got", thai_meaning: "ได้รับ" },
                    { present: "give", past: "gave", past_participle: "given", thai_meaning: "ให้" },
                    { present: "find", past: "found", past_participle: "found", thai_meaning: "พบ" }
                ];
            }
        }

        // Function to get a unique cycle ID based on the date and time period
            function getCycleId() {
            const now = new Date();
            const cycleHour = now.getHours();
            const date = now.toISOString().slice(0, 10);
            if (cycleHour >= 6 && cycleHour < 18) {
                return `${date}-day`;
            } else {
                return `${date}-night`;
            }
        }

        // Function to get the next reset time (either 06:00 or 18:00)
        function getNextResetTime() {
            const now = new Date();
            const nextReset = new Date(now);
            
            if (now.getHours() < 6) {
                // If it's before 06:00, next reset is at 06:00 today
                nextReset.setHours(6, 0, 0, 0);
            } else if (now.getHours() < 18) {
                // If it's between 06:00-17:59, next reset is at 18:00 today
                nextReset.setHours(18, 0, 0, 0);
            } else {
                // If it's after 18:00, next reset is at 06:00 tomorrow
                nextReset.setDate(nextReset.getDate() + 1);
                nextReset.setHours(6, 0, 0, 0);
            }
            
            return nextReset;
        }

        // Function to calculate remaining time until next reset
        function getRemainingTimeToReset() {
            const now = new Date();
            const nextReset = getNextResetTime();
            return Math.max(0, Math.floor((nextReset - now) / 1000));
        }

        // Function to check progress on page load
        async function checkProgressOnLoad() {
            const currentCycleId = getCycleId();

            // Check if there's stored data for the current cycle
            if (typeof(Storage) !== "undefined") {
                const storedData = localStorage.getItem('dailyWordsData');
                
                if (storedData) {
                    const data = JSON.parse(storedData);
                    if (data.cycleId === currentCycleId) {
                        // Continue from stored progress
                        dailyWords = data.words;
                        completedWordsCount = data.completed;
                        correctAnswers = data.score;
                        currentWordIndex = completedWordsCount;

                        document.getElementById('startSection').style.display = 'none';
                        document.getElementById('continueSection').style.display = 'block';
                        document.getElementById('continueMessage').textContent = `คุณทำไปแล้ว ${completedWordsCount} จาก 10 คำ (คะแนน: ${correctAnswers}/${completedWordsCount})`;
                        updateProgressBar();
                        startTimer();
                        return;
                    }
                }
            }

            // No stored data or a new cycle - start fresh
            dailyWords = await getRandomWords(10);
            completedWordsCount = 0;
            correctAnswers = 0;
            currentWordIndex = 0;
            document.getElementById('startSection').style.display = 'block';
            document.getElementById('continueSection').style.display = 'none';
            document.getElementById('appContent').style.display = 'none';
            startTimer();
        }

        // Function to get 10 random words from the fetched data
        async function getRandomWords(count) {
            const allWords = await fetchWords();
            const shuffled = [...allWords].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        }

        // Function to start the app
        function startApp() {
            document.getElementById('startSection').style.display = 'none';
            document.getElementById('appContent').style.display = 'block';
            displayCurrentWord();
            showProgressBar();
        }

        // Function to continue the app from saved progress
        function continueApp() {
            document.getElementById('continueSection').style.display = 'none';
            document.getElementById('appContent').style.display = 'block';
            displayCurrentWord();
            showProgressBar();
        }

        // Function to display the current word and its forms
        function displayCurrentWord() {
            if (completedWordsCount >= 10) {
                updateProgressAndScore();
                return;
            }

            const word = dailyWords[currentWordIndex];
            document.getElementById('wordEnglishPresent').textContent = word.present;
            document.getElementById('wordEnglishPast').textContent = word.past;
            document.getElementById('wordEnglishPastParticiple').textContent = word.past_participle;

            document.getElementById('inputThai').value = '';
            document.getElementById('answerContent').style.display = 'none';
            document.getElementById('checkAnswerBtn').style.display = 'inline-block';
            document.getElementById('inputThai').focus();
        }

        // Function to check the user's answer
        function checkAnswer() {
            const input = document.getElementById('inputThai').value.trim();
            if (!input) {
                Swal.fire({
                    icon: 'warning',
                    title: 'กรุณากรอกคำตอบ',
                    text: 'โปรดกรอกคำแปลภาษาไทยก่อนตรวจสอบ',
                    confirmButtonText: 'ตกลง'
                });
                return;
            }

            const correctMeaning = dailyWords[currentWordIndex].thai_meaning;
            const isCorrect = correctMeaning.split(',').some(m => 
                input.toLowerCase().includes(m.trim().toLowerCase()) || 
                m.trim().toLowerCase().includes(input.toLowerCase())
            );

            document.getElementById('correctThai').textContent = correctMeaning;
            document.getElementById('answerContent').style.display = 'block';
            document.getElementById('checkAnswerBtn').style.display = 'none';

            if (isCorrect) {
                correctAnswers++;
                Swal.fire({
                    icon: 'success',
                    title: '🎉 ถูกต้อง!',
                    text: `ยอดเยี่ยม! คำตอบคือ "${correctMeaning}"`,
                    confirmButtonText: 'ดำเนินการต่อ',
                    timer: 3000,
                    timerProgressBar: true
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: '❌ ผิด',
                    text: `คำตอบที่ถูกต้องคือ "${correctMeaning}"`,
                    confirmButtonText: 'ดำเนินการต่อ',
                    timer: 4000,
                    timerProgressBar: true
                });
            }
        }

        // Function to update progress bar and display the next word
        function nextWord() {
            completedWordsCount++;
            currentWordIndex++;
            updateProgressBar();

            // Save progress
            if (typeof(Storage) !== "undefined") {
                const currentCycleId = getCycleId();
                localStorage.setItem('dailyWordsData', JSON.stringify({
                    cycleId: currentCycleId,
                    words: dailyWords,
                    completed: completedWordsCount,
                    score: correctAnswers
                }));
            }

            if (completedWordsCount < 10) {
                displayCurrentWord();
            } else {
                updateProgressAndScore();
            }
        }

        // Function to update progress bar based on completed words
        function updateProgressBar() {
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const totalWords = 10;
            const progress = (completedWordsCount / totalWords) * 100;
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            
            if (progressText) {
                progressText.textContent = `${completedWordsCount}/${totalWords}`;
            }
        }

        // Function to show the progress bar
        function showProgressBar() {
            const progressContainer = document.getElementById('progressContainer');
            if (progressContainer) {
                progressContainer.classList.remove('hidden');
                progressContainer.classList.add('visible');
                updateProgressBar();
            }
        }

        // Function to update progress and score when done
        function updateProgressAndScore() {
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            
            if (progressFill) {
                progressFill.style.width = '100%';
            }
            if (progressText) {
                progressText.textContent = '10/10';
            }
            
            document.getElementById('wordCard').style.display = 'none';
            document.getElementById('completedMessage').style.display = 'block';
            document.getElementById('scoreMessage').textContent = `คุณทำคะแนนได้ ${correctAnswers} จาก 10 คำ! 🎯`;
            
            // Show celebration animation
            Swal.fire({
                title: '🎉 เสร็จแล้ว!',
                html: `<strong>คะแนนของคุณ: ${correctAnswers}/10</strong><br><br>กลับมาเรียนใหม่ในรอบถัดไป!`,
                icon: 'success',
                confirmButtonText: 'เยี่ยม!',
                allowOutsideClick: false
            });
        }

        // Function to reset the current cycle's progress
        function resetProgress() {
            Swal.fire({
                title: 'คุณแน่ใจไหม? 🤔',
                text: "การกระทำนี้จะลบความคืบหน้าในรอบปัจจุบันทั้งหมด!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'ใช่, รีเซ็ตเลย!',
                cancelButtonText: 'ยกเลิก'
            }).then((result) => {
                if (result.isConfirmed) {
                    if (typeof(Storage) !== "undefined") {
                        localStorage.removeItem('dailyWordsData');
                    }
                    location.reload();
                }
            });
        }

        // Timer functionality - Updated to work with fixed reset times
        function startTimer() {
            function updateTimer() {
                const remainingTime = getRemainingTimeToReset();

                if (remainingTime <= 0) {
                    document.getElementById('timer').textContent = "🎯 พร้อมเริ่มรอบใหม่!";
                    // Auto refresh when time is up
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                    return;
                }

                const hours = Math.floor(remainingTime / 3600);
                const minutes = Math.floor((remainingTime % 3600) / 60);
                const seconds = remainingTime % 60;

                document.getElementById('timer').textContent =
                    `⏰ รอบถัดไปใน ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }

            updateTimer();
            timerInterval = setInterval(updateTimer, 1000);
        }

        // Add Enter key support for input
        document.addEventListener('DOMContentLoaded', function() {
            const inputField = document.getElementById('inputThai');
            if (inputField) {
                inputField.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        const checkBtn = document.getElementById('checkAnswerBtn');
                        const nextBtn = document.getElementById('nextWordBtn');
                        
                        if (checkBtn && checkBtn.style.display !== 'none') {
                            checkAnswer();
                        } else if (nextBtn && nextBtn.style.display !== 'none') {
                            nextWord();
                        }
                    }
                });
            }
        });