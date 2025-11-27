function getRandom(min, max) {
    if(min> max) return -1;
    return Math.ceil( (Math.random() * (max-min))+min)
}

let levelH2;
let EB;
let FB;
let scoreH2;
let eggs;
let load;
let level = 1;
let score = 0;
let bullets = 5;
let HighScore = 0;
let isHunted = false;
let Gspeed = 2500; // Интервал генерации объектов (больше = реже появляются) - баланс для ловли
let Dspeed = 3.5; // Скорость падения (больше = быстрее падают) - умеренная скорость для возможности ловли
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
let gameTimer = 60; // 1 минута в секундах
let timerInterval = null;
let gameActive = true;
let timerH2;
let userInteracted = false; // Флаг для отслеживания взаимодействия пользователя

// Массив с именами файлов фотографий людей (только существующие файлы)
const personImages = [
    "imgs/sticker.webp",
    "imgs/sticker1.webp",
    "imgs/sticker 6.webp",
    "imgs/sticker 7.webp",
    "imgs/sticker 8.webp",
    "imgs/sticker 9.webp",
    "imgs/sticker 10.webp",
    "imgs/sticker 11.webp",
    "imgs/sticker 12.webp",
    "imgs/sticker 13.webp",
    "imgs/sticker 14.webp"
];

// Запасной вариант - если фотографии не найдены, объект просто не отобразится
const fallbackImage = null; // Убрали fallback, так как файла нет

// Настройка музыки игры
const gameMusic = new Audio('sounds/loll1.mp3');
gameMusic.loop = true; 
gameMusic.volume = 1.0; // Максимальная громкость

// Проверяем загрузку музыки
gameMusic.addEventListener('canplaythrough', function() {
    console.log('Музыка загружена и готова к воспроизведению');
});

gameMusic.addEventListener('error', function(e) {
    console.error('Ошибка загрузки музыки:', e);
});

gameMusic.addEventListener('loadeddata', function() {
    console.log('Музыка загружена');
});

// Звук сбора - не создаем, так как файла нет
let loadMusic = null;


window.addEventListener("resize", function() {
    screenHeight = window.innerHeight;
    screenWidth = window.innerWidth;
});


let x;
let y;
let deg;
let GspeedInterval ;
let DspeedInterval ;

function changeSpeed(GSpeed, DSpeed) {
    clearInterval(GspeedInterval);
    clearInterval(DspeedInterval);
    GenerateEgges(parseInt(GSpeed));
    eggAnimation(parseInt(DSpeed));
}

function increseScore() {
    if(!gameActive) return; // Не увеличиваем счет если игра остановлена
    score++;
    if(score>0){
        EB.style.visibility = "hidden";
        FB.style.visibility = "visible";
        // Воспроизводим звук только если пользователь уже взаимодействовал и файл существует
        if(userInteracted && loadMusic) {
            loadMusic.pause();
            loadMusic.currentTime = 0; // Сбрасываем на начало
            loadMusic.play().catch(function(error) {
                // Игнорируем ошибки воспроизведения звука
                console.log("Не удалось воспроизвести звук:", error);
            });
        }
    }
    if(score>HighScore){
        HighScore = score;
        HighScoreH2.innerText = score
        localStorage.setItem('HighScore', HighScore)
    }
    if(score % 10 == 0){
        level = score/10;
        // Увеличиваем скорость падения постепенно, но не слишком быстро
        changeSpeed(Math.max(2000, Gspeed-(level*1)), Math.min(5.0, Dspeed + 0.2));
    }
    levelH2.innerText = level
    scoreH2.innerText = score
}

function eggAnimation(speed) {
    DspeedInterval = window.setInterval(function (e) {
        if(!gameActive) return; // Останавливаем анимацию если игра не активна
        eggs = document.getElementsByClassName('Gegg');
        for (const egg of eggs) {
            let eggPos = egg.getBoundingClientRect();
            let FBPos = FB ? FB.getBoundingClientRect() : null;

            if(eggPos.top >= (screenHeight-eggPos.height) || eggPos.bottom < 0){
                // Объект упал, удаляем его
                egg.style.top = "unset"
                egg.style.bottom = "-1px"
                setTimeout(function (e) {
                    egg.remove();
                } , 1000)
                continue;
            }else{
                egg.style.top =( eggPos.top + Dspeed) +"px";
            } 
            if(FBPos && (FBPos.left <= eggPos.left && FBPos.left+FB.width >= eggPos.left+eggPos.width) && (FBPos.top <= eggPos.top )) {
                increseScore();
                
                egg.remove();
            }
        }
    }, speed)
}

// Переменная для отслеживания последнего использованного изображения
let lastUsedImageIndex = -1;

// Функция для получения случайного изображения человека (исключаем повторения)
function getRandomPersonImage() {
    let randomIndex;
    // Повторяем выбор, пока не получим другое изображение
    do {
        randomIndex = Math.floor(Math.random() * personImages.length);
    } while (randomIndex === lastUsedImageIndex && personImages.length > 1);
    
    lastUsedImageIndex = randomIndex;
    return personImages[randomIndex];
}

function GenerateEgges(speed) {
    GspeedInterval = window.setInterval(function (e) {
        if(!gameActive) return; // Не генерируем объекты если игра не активна
        
        // Проверяем количество объектов на экране - максимум 3-4 для возможности ловли
        eggs = document.getElementsByClassName('Gegg');
        // Случайно выбираем максимум: 3 или 4 объекта
        const maxObjects = Math.floor(Math.random() * 2) + 3; // 3 или 4
        if(eggs.length >= maxObjects) {
            return; // Не создаем новый объект, если уже достигнут максимум
        }
        
        // Создаем только ОДИН объект за раз, чтобы не спамить одновременно
        let eggImg= document.createElement('img');
        // Случайно выбираем одно из изображений людей
        const imageSrc = getRandomPersonImage();
        eggImg.src = imageSrc;
        eggImg.className = "Gegg"
        
        // Проверяем позиции существующих объектов, чтобы не создавать слишком близко
        let attempts = 0;
        let newLeft;
        let tooClose = false;
        
        do {
            tooClose = false;
            newLeft = getRandom(0, (screenWidth) - 80);
            
            // Проверяем расстояние до существующих объектов (минимум 100px)
            for(let i = 0; i < eggs.length; i++) {
                const existingLeft = parseInt(eggs[i].style.left) || 0;
                if(Math.abs(newLeft - existingLeft) < 100) {
                    tooClose = true;
                    break;
                }
            }
            attempts++;
        } while(tooClose && attempts < 10); // Максимум 10 попыток
        
        eggImg.style.left = newLeft + "px";
        
        // Уменьшаем размер для sticker1.webp
        if(imageSrc.includes('sticker1.webp')) {
            eggImg.style.width = '50px'; // Меньше обычного размера
            eggImg.style.maxWidth = '50px';
        }
        
        // Если изображение не загрузилось, просто удаляем его
        eggImg.onerror = function() {
            this.remove(); // Удаляем объект, если изображение не загрузилось
        };
        document.body.appendChild(eggImg)
    },speed)
}

function startTimer() {
    timerInterval = setInterval(function() {
        if(gameTimer > 0) {
            gameTimer--;
            timerH2.innerText = gameTimer;
        } else {
            endGame();
        }
    }, 1000);
}

function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    clearInterval(GspeedInterval);
    clearInterval(DspeedInterval);
    gameMusic.pause();
    
    // Показываем модальное окно с результатом
    const modal = document.getElementById('gameOverModal');
    const finalScoreSpan = document.getElementById('finalScore');
    finalScoreSpan.innerText = score;
    modal.style.display = 'flex';
}

window.restartGame = function() {
    // Скрываем модальное окно
    const modal = document.getElementById('gameOverModal');
    modal.style.display = 'none';
    
    // Удаляем все объекты
    eggs = document.getElementsByClassName('Gegg');
    while(eggs.length > 0) {
        eggs[0].remove();
    }
    
    // Сбрасываем переменные
    gameTimer = 60;
    score = 0;
    level = 1;
    gameActive = true;
    
    // Обновляем отображение
    timerH2.innerText = gameTimer;
    scoreH2.innerText = score;
    levelH2.innerText = level;
    
    // Перезапускаем игру
    GenerateEgges(Gspeed);
    eggAnimation(16); // Интервал обновления анимации (меньше = плавнее)
    startTimer();
}



window.addEventListener('load',function (e) {
    HighScore = parseInt(this.localStorage.getItem('HighScore'))
    if(isNaN(HighScore)) {
        HighScore = 0;
    }
    levelH2 = this.document.getElementsByClassName('level')[0];
    scoreH2 = this.document.getElementsByClassName('score')[0];
    HighScoreH2 = this.document.getElementsByClassName('HighScore')[0];
    timerH2 = this.document.getElementsByClassName('timer')[0];
    HighScoreH2.innerText = HighScore;
    timerH2.innerText = gameTimer;
    EB = this.document.getElementsByClassName('EB')[0];
    FB = this.document.getElementsByClassName('FB')[0];
    
    // Если изображения корзинки не загрузились, создаем запасной вариант
    if(!EB || EB.offsetWidth === 0) {
        const basketDiv = document.createElement('div');
        basketDiv.id = 'basketFallback';
        basketDiv.style.position = 'absolute';
        basketDiv.style.bottom = '5px';
        basketDiv.style.width = '175px';
        basketDiv.style.height = '100px';
        basketDiv.style.backgroundColor = '#8B4513';
        basketDiv.style.borderRadius = '10px';
        basketDiv.style.border = '3px solid #654321';
        basketDiv.style.left = (screenWidth - 175/2) + 'px';
        document.body.appendChild(basketDiv);
        EB = basketDiv;
        FB = basketDiv;
    } else {
        EB.style.left = screenWidth-(FB.offsetWidth/2)+"px";
        FB.style.left = screenWidth-(FB.offsetWidth/2)+"px";
    }

    // Функция для перемещения корзинки
    function moveBasket(clientX) {
        if(!gameActive) return; // Не двигаем корзину если игра остановлена
        x = clientX - (FB.offsetWidth/2);
        if(x < 0) x = 0;
        if(x+FB.offsetWidth >= (screenWidth)) x = (screenWidth) - FB.offsetWidth;
        
        EB.style.left = (x) + "px";
        FB.style.left = (x) + "px";
    }

    // Управление мышью (для десктопа)
    let mouseMusicStarted = false;
    window.addEventListener('mousemove', function(e){
        // Сначала отмечаем взаимодействие
        if(!userInteracted) {
            userInteracted = true;
        }
        // Запускаем музыку только после реального взаимодействия пользователя
        if(!mouseMusicStarted && gameActive && userInteracted) {
            mouseMusicStarted = true;
            // Небольшая задержка, чтобы браузер понял, что это реальное взаимодействие
            setTimeout(function() {
                gameMusic.volume = 1.0;
                gameMusic.play().then(function() {
                    console.log('Музыка запущена при движении мыши, громкость:', gameMusic.volume);
                }).catch(function(error) {
                    console.log("Не удалось воспроизвести музыку:", error);
                    mouseMusicStarted = false; // Разрешаем попробовать снова
                });
            }, 100);
        }
        moveBasket(e.clientX);
    });

    // Управление касанием (для мобильных устройств)
    let isTouching = false;
    let touchMusicStarted = false;
    
    window.addEventListener('touchstart', function(e){
        if(!gameActive) return;
        // Сначала отмечаем взаимодействие
        if(!userInteracted) {
            userInteracted = true;
        }
        // Запускаем музыку только после реального взаимодействия пользователя
        if(!touchMusicStarted && gameActive && userInteracted) {
            touchMusicStarted = true;
            // Небольшая задержка, чтобы браузер понял, что это реальное взаимодействие
            setTimeout(function() {
                gameMusic.volume = 1.0;
                gameMusic.play().then(function() {
                    console.log('Музыка запущена при касании, громкость:', gameMusic.volume);
                }).catch(function(error) {
                    console.log("Не удалось воспроизвести музыку:", error);
                    touchMusicStarted = false; // Разрешаем попробовать снова
                });
            }, 100);
        }
        isTouching = true;
        e.preventDefault(); // Предотвращаем скролл
        if(e.touches.length > 0) {
            moveBasket(e.touches[0].clientX);
        }
    }, {passive: false}); // Добавляем {passive: false} для preventDefault

    window.addEventListener('touchmove', function(e){
        if(!gameActive || !isTouching) return;
        userInteracted = true; // Отмечаем взаимодействие пользователя
        e.preventDefault(); // Предотвращаем скролл
        if(e.touches.length > 0) {
            moveBasket(e.touches[0].clientX);
        }
    }, {passive: false}); // Добавляем {passive: false} для preventDefault

    window.addEventListener('touchend', function(e){
        isTouching = false;
    });

    window.addEventListener('touchcancel', function(e){
        isTouching = false;
    });

    // Флаг для отслеживания, была ли музыка запущена
    let musicStarted = false;
    
    // Функция для запуска музыки (только один раз)
    function startMusic() {
        if(!musicStarted && gameActive && userInteracted) {
            musicStarted = true;
            gameMusic.play().then(function() {
                console.log('Музыка запущена успешно');
            }).catch(function(error) {
                console.log("Не удалось воспроизвести музыку:", error);
                musicStarted = false; // Разрешаем попробовать снова
            });
        }
    }
    
    // Запускаем музыку при клике
    let clickMusicStarted = false;
    this.document.body.addEventListener('click',function(e){
        if(!userInteracted) {
            userInteracted = true;
            if(!clickMusicStarted && gameActive) {
                clickMusicStarted = true;
                // Увеличиваем громкость перед запуском
                gameMusic.volume = 1.0;
                gameMusic.play().then(function() {
                    console.log('Музыка запущена при клике, громкость:', gameMusic.volume);
                }).catch(function(error) {
                    console.log("Не удалось воспроизвести музыку:", error);
                });
            }
        }
    });

    GenerateEgges(Gspeed);
    eggAnimation(16); // Интервал обновления анимации (меньше = плавнее)
    startTimer(); // Запускаем таймер
});
