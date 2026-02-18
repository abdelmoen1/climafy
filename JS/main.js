/* ===== variables ===== */

/* Form main reference */
const form = document.querySelector("form");

/* Submit button (not heavily used because submit event is on form) */
const submitBtn = document.querySelector("form input[type='submit']");

/* Text input where user writes city name */
const cityInput = document.querySelector("form input[type='text']");

/* Span used to display validation error */
const errorSpan = document.querySelector("form span");

/* Static array used to convert Date.getDay() index into readable day name */
const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/* Global state: holds latest API response */
let weatherData;

/* ===== helpers UI ===== */

/* 
   showError():
   - Displays validation message
   - Adjusts form layout on small screens
   - Highlights input with red border
*/
function showError() {
    errorSpan.textContent = 'Input field cannot be empty...';
    if (window.innerWidth < 600) form.style.gap = "25px";
    cityInput.style.border = "1px solid red";
}

/*
   hideError():
   - Clears error message
   - Resets layout spacing
   - Removes red border
*/
function hideError() {
    errorSpan.textContent = "";
    form.style.gap = "10px";
    cityInput.style.border = "none";
}


/*
   createLoadingPage():
   - Builds full skeleton UI dynamically
   - Prevents duplicate loading screens
   - Returns the created (or existing) loading container
   - Used before API request completes
*/
function createLoadingPage() {
    // إذا فيه loading page حالياً، رجعها (prevent duplicates)
    const existing = document.querySelector(".loading-page");
    if (existing) return existing;

    const loadingPage = document.createElement("div");
    loadingPage.className = "loading-page";

    const contantDiv = document.createElement("div");

    // section 1 (bg + info)
    const sectionOne = document.createElement("section");
    const bgTemp = document.createElement("div");
    bgTemp.className = "bg-temp";

    // loading animation
    const loadingAnimation = document.createElement("div");
    loadingAnimation.className = "loading";
    const dotsContainer = document.createElement("div");
    for (let i = 0; i < 3; i++) {
        const span = document.createElement("span");
        dotsContainer.appendChild(span);
    }
    loadingAnimation.appendChild(dotsContainer);
    const loadingWord = document.createElement("div");
    loadingWord.textContent = "Loading...";
    loadingAnimation.appendChild(loadingWord);

    bgTemp.appendChild(loadingAnimation);
    sectionOne.appendChild(bgTemp);

    // info temp (4 boxes)
    const infoTemp = document.createElement("div");
    infoTemp.className = "info-temp";
    for (let i = 0; i < 4; i++) {
        const infoDivs = document.createElement("div");
        const spanOne = document.createElement("span");
        const spanTwo = document.createElement("span");
        infoDivs.appendChild(spanOne);
        infoDivs.appendChild(spanTwo);
        infoTemp.appendChild(infoDivs);
    }
    // labels
    const feelLikeLbl = infoTemp.querySelector("div:first-child span:first-child");
    if (feelLikeLbl) feelLikeLbl.textContent = "Feels Like";
    const humidityLbl = infoTemp.querySelector("div:nth-child(2) span:first-child");
    if (humidityLbl) humidityLbl.textContent = "Humidity";
    const windLbl = infoTemp.querySelector("div:nth-child(3) span:first-child");
    if (windLbl) windLbl.textContent = "Wind";
    const precipitationLbl = infoTemp.querySelector("div:nth-child(4) span:first-child");
    if (precipitationLbl) precipitationLbl.textContent = "Precipitation";

    // set underscores initially for values
    const numsSpan = infoTemp.querySelectorAll("div");
    numsSpan.forEach(div => {
        let span = div.querySelector("span:last-of-type");
        if (span) span.textContent = "_";
    });

    sectionOne.appendChild(infoTemp);
    contantDiv.appendChild(sectionOne);

    // section 2 (daily forecast)
    const sectionTwo = document.createElement("section");
    const heroSpan = document.createElement("span");
    heroSpan.className = "hero-span";
    heroSpan.textContent = "Daily forecast";
    sectionTwo.appendChild(heroSpan);

    const forecastContainer = document.createElement("div");
    forecastContainer.className = "forecast-grid";
    for (let i = 0; i < weekDays.length; i++) {
        const dayDiv = document.createElement("div");
        // placeholder structure
        dayDiv.innerHTML = `<span class="day-name">${[...weekDays[i]].slice(0, 3).join("")}</span><span class="day-temp"></span>`;
        forecastContainer.appendChild(dayDiv);
    }
    sectionTwo.appendChild(forecastContainer);
    contantDiv.appendChild(sectionTwo);

    loadingPage.appendChild(contantDiv);

    // aside hourly
    const aside = document.createElement("aside");
    const hourlySection = document.createElement("div");
    hourlySection.className = "hourly-section";

    const headHourly = document.createElement("div");
    headHourly.className = "head-temp-hourly";

    const h4 = document.createElement('h4');
    h4.textContent = "Hourly forecast";
    headHourly.appendChild(h4);

    const hourlyNav = document.createElement("nav");
    const mainTitle = document.createElement("div");
    mainTitle.className = "main-title";
    const titleSpan = document.createElement("span");
    titleSpan.textContent = "-";
    mainTitle.appendChild(titleSpan);
    hourlyNav.appendChild(mainTitle);

    headHourly.appendChild(hourlyNav);
    hourlySection.append(headHourly);

    const timeTemps = document.createElement("ul");
    timeTemps.className = "hourly-menu-list";
    for (let i = 0; i < 8; i++) {
        const li = document.createElement("li");
        li.textContent = "-";
        timeTemps.appendChild(li);
    }

    hourlySection.appendChild(timeTemps);
    aside.appendChild(hourlySection);
    loadingPage.appendChild(aside);

    document.body.appendChild(loadingPage);
    return loadingPage;
}

/*
   apiErrorMsg(msg):
   - Hides form and hero section
   - Removes any previous error screen
   - Creates error UI dynamically
   - Adds Retry button with event listener
   - Retry restores form and clears input
*/
function apiErrorMsg(msg) {
    form.setAttribute("hidden", "");
    const hero = document.querySelector(".hero");
    if (hero) hero.setAttribute("hidden", "");
    const existing = document.querySelector(".wrong-page");
    if (existing) existing.remove();

    const wrongContainer = document.createElement("div");
    wrongContainer.className = "wrong-page";

    const errorIcon = document.createElement("i");
    errorIcon.className = "fa-solid fa-ban";
    wrongContainer.appendChild(errorIcon);

    const h1 = document.createElement("h1");
    h1.textContent = msg;
    wrongContainer.appendChild(h1);

    const p = document.createElement("p");
    p.textContent = "We couldn't connect to the server (API error). please try again in few moments.";
    wrongContainer.appendChild(p);

    const retryDiv = document.createElement("div");
    retryDiv.className = "retry";
    const retryIcon = document.createElement("i");
    retryIcon.className = "fa-solid fa-arrows-rotate";
    retryDiv.appendChild(retryIcon);
    const retryWord = document.createElement("div");
    retryWord.textContent = "Retry";
    retryDiv.appendChild(retryWord);
    wrongContainer.appendChild(retryDiv);
    document.body.appendChild(wrongContainer);

    const retry = document.querySelector(".retry");
    if (retry) {
        retry.addEventListener("click", () => {
            form.removeAttribute("hidden");
            if (hero) hero.removeAttribute("hidden");
            const wp = document.querySelector(".wrong-page");
            if (wp) wp.remove();
            cityInput.value = "";
        });
    }
}

/*
   addingTheData(container, data):
   - Takes the generated container (skeleton)
   - Injects API response values into DOM
   - Replaces placeholders
   - Updates:
        * City + Date
        * Current temperature
        * Info boxes
        * Daily forecast
        * Hourly forecast
*/
function addingTheData(container, data) {
    if (!container || !data) return;

    // HISTORY: container includes .bg-temp, .info-temp, .forecast-grid, .hourly-menu-list
    const bgTemp = container.querySelector(".bg-temp");
    if (bgTemp) {
        // remove previous city/date if موجود
        const existingCity = bgTemp.querySelector(".city-w-date");
        if (existingCity) existingCity.remove();

        const cityWithDate = document.createElement("div");
        cityWithDate.className = "city-w-date";

        const h1 = document.createElement("h1");
        h1.textContent = `${data.location.name}, ${data.location.country}` || "-";
        cityWithDate.appendChild(h1);

        const dateObj = new Date(data.location.localtime);
        const dayName = weekDays[dateObj.getDay()] || "";
        const dateStr = [...data.location.localtime].slice(0, 10).join("");
        const p = document.createElement("p");
        p.textContent = `${dayName}, ${dateStr}`;
        cityWithDate.appendChild(p);
        bgTemp.appendChild(cityWithDate);

        // temp with icon
        const tempWithIcon = document.createElement("div");
        tempWithIcon.className = "temp-w-icon";

        const img = document.createElement("img");
        let iconUrl = 'https:' + data.current.condition.icon;
        img.src = iconUrl;
        img.alt = data.current.condition.text || "condition";
        tempWithIcon.appendChild(img);

        const mainH1 = document.createElement("h1");
        const italianText = document.createElement("i");
        italianText.textContent = `${data.current.temp_c}°`;
        mainH1.appendChild(italianText);
        tempWithIcon.appendChild(mainH1);

        bgTemp.appendChild(tempWithIcon);
    }

    // info-temp values (feels like, humidity, wind, precip)
    const infoDivs = container.querySelectorAll(".info-temp > div");
    if (infoDivs && infoDivs.length >= 4) {
        // feels like
        const feelSpan = infoDivs[0].querySelector("span:last-of-type");
        if (feelSpan) feelSpan.textContent = `${data.current.feelslike_c}°`;
        const humSpan = infoDivs[1].querySelector("span:last-of-type");
        if (humSpan) humSpan.textContent = `${data.current.humidity}%`;
        const windSpan = infoDivs[2].querySelector("span:last-of-type");
        if (windSpan) windSpan.textContent = `${data.current.wind_kph} km/h`;
        const precSpan = infoDivs[3].querySelector("span:last-of-type");
        if (precSpan) precSpan.textContent = `${data.current.precip_mm} mm`;
    }

    // daily forecast (use forecast.forecastday)
    const forecastGrid = container.querySelector(".forecast-grid");
    if (forecastGrid && data.forecast && Array.isArray(data.forecast.forecastday)) {
        // clear existing
        forecastGrid.innerHTML = "";
        data.forecast.forecastday.forEach((fd, i) => {
            const dayDiv = document.createElement("div");
            const name = [...weekDays[i]].slice(0, 3).join("");
            const dayNameH4 = document.createElement("h4");
            dayNameH4.textContent = name;
            dayDiv.appendChild(dayNameH4);

            const dailyIcon = document.createElement("img");
            let iconUrl = fd.day.condition.icon;
            dailyIcon.src = "https:" + iconUrl;
            dailyIcon.alt = fd.day.condition.text || "condition";
            dayDiv.appendChild(dailyIcon);

            const tempsDayNight = document.createElement("div");
            tempsDayNight.className = "temp-day-night";
            const daySpan = document.createElement("span");
            daySpan.textContent = `${fd.day.maxtemp_c}°`;
            tempsDayNight.appendChild(daySpan);
            const nightSpan = document.createElement("span");
            nightSpan.textContent = `${fd.day.mintemp_c}°`
            tempsDayNight.appendChild(nightSpan);
            dayDiv.appendChild(tempsDayNight);
            forecastGrid.appendChild(dayDiv);
        });
    }
    // daily list for hourly forecast
    let nav = container.querySelector("nav");
    let mainTitle = nav.querySelector(".main-title");
    if (mainTitle) {
        const nowDay = mainTitle.querySelector("span");
        const dateObj = new Date(data.location.localtime);
        const dayName = weekDays[dateObj.getDay()] || "";
        nowDay.textContent = dayName;
    }
    // hourly menu list -> default use today's hours (first forecastday)
    const hourlyList = container.querySelector(".hourly-menu-list");
    const hours = data.forecast.forecastday[0].hour;
    if (hourlyList) {
        hourlyList.innerHTML = ""; // clear placeholders
        for (let i = 0; i < 8; i++) {
            const li = document.createElement("li");
            const hourState = document.createElement("div");
            hourState.className = "hour-state";
            const hourIcon = document.createElement("img");
            hourIcon.src = "https:" + hours[i].condition.icon;
            hourIcon.alt = hours[i].condition.text;
            hourState.appendChild(hourIcon);
            const hourSpan = document.createElement("span");
            hourSpan.textContent = hours[i].time.slice(11);
            hourState.appendChild(hourSpan);
            li.appendChild(hourState);
            const hourTemp = document.createElement("div");
            hourTemp.className = "hour-temp";
            hourTemp.textContent = `${hours[i].temp_c}°`
            li.appendChild(hourTemp);
            hourlyList.appendChild(li);
        }
    }
}

/*
   createWeatherApp(data):
   - Ensures skeleton exists
   - Removes loading animation spinner
   - Moves skeleton inside <main>
   - Fills real data inside it
*/
function createWeatherApp(data) {
    // find or create loading skeleton
    let loadingPage = document.querySelector(".loading-page");
    if (!loadingPage) {
        loadingPage = createLoadingPage();
    }

    // remove loading animation inside skeleton And remove className of loadingPage
    loadingPage.classList.remove("loading-page");
    const loadingAnimation = loadingPage.querySelector(".loading");
    if (loadingAnimation) loadingAnimation.remove();

    // move loadingPage inside a main element to be the app container
    const main = document.createElement("main");
    // appendChild(loadingPage) will move it from body into main
    main.appendChild(loadingPage);
    document.body.appendChild(main);

    // fill data inside the moved container
    addingTheData(loadingPage, data);
}

/*
   getWeatherData(city):
   - Sends request to WeatherAPI
   - Handles:
        1) API logical errors (200 + error object)
        2) HTTP errors
        3) Network errors (catch block)
   - On success:
        saves data globally
        creates weather app
*/
async function getWeatherData(city) {
    const keyApi = '42d651264f6242b3a52122819260702';
    try {
        const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${keyApi}&q=${city}&days=7`);
        const data = await response.json();

        // handle API-level error (WeatherAPI returns 200 + error object)
        if (data.error) {
            const lp = document.querySelector(".loading-page");
            if (lp) lp.remove();
            apiErrorMsg(data.error.message || "API error");
            return;
        }

        // handle HTTP error (rare here but keep)
        if (!response.ok) {
            const lp = document.querySelector(".loading-page");
            if (lp) lp.remove();
            apiErrorMsg(`HTTP Error ${response.status}`);
            return;
        }

        // success
        weatherData = data;
        createWeatherApp(data);
    } catch (error) {
        console.error(error);
        const lp = document.querySelector(".loading-page");
        if (lp) lp.remove();
        apiErrorMsg("Network error");
    }
}

/*
   isFetching:
   - Prevents multiple simultaneous API calls
*/
let isFetching = false;

/*
   check():
   - Prevents duplicate calls
   - Validates input
   - Removes old main app
   - Creates loading skeleton
   - Calls API
*/
async function check() {
    if (isFetching) return;
    const cityName = cityInput.value.trim();
    if (!cityName) {
        showError();
        return;
    }

    hideError();
    const mainPage = document.querySelector("main");
    if (mainPage) mainPage.remove();

    createLoadingPage();
    isFetching = true;
    try {
        await getWeatherData(cityName); // getWeatherData is async so await it
    } finally {
        isFetching = false;
    }
}

/* Submit event (prevent page reload) */
form.addEventListener("submit", (e) => {
    e.preventDefault();
    check();
});

/* Hide error when user focuses input */
cityInput.addEventListener("focus", hideError);


/*
   dropDownUnitList():
   - Toggles unit list visibility
   - Uses class switching instead of inline style
*/
const unitsSittingsBtn = document.querySelector("header nav .main-title");
const unitList = document.querySelector("header nav ul");
function dropDownUnitList() {
    let isHidden = unitList.classList.contains("hidden");
    unitList.classList.toggle("visa", isHidden);
    unitList.classList.toggle("hidden", !isHidden);
}
unitsSittingsBtn.addEventListener("click", dropDownUnitList);

const unitBtns = document.querySelectorAll("header nav ul li .btn");

/*
   callingContainer():
   - Returns <main> element
   - Guard clause if app not yet rendered
*/
function callingContainer() {
    const container = document.querySelector("main");
    if (!container) return;
    return container;
}

/*
   toF():
   - Converts all temperature values to Fahrenheit
   - Updates:
        * Main temp
        * Feels like
        * Hourly temps
        * Daily forecast temps
*/
function toF() {
    const container = callingContainer();
    if (container) {
        const hours = weatherData.forecast.forecastday[0].hour;

        container.querySelector(".temp-w-icon h1 i").textContent = `${weatherData.current.temp_f}°`;
        container.querySelector(".info-temp div:first-of-type span:nth-of-type(2)").textContent = `${weatherData.current.feelslike_f}°`;
        container.querySelectorAll(".hourly-menu-list li").forEach((li, index) => {
            li.querySelector(".hour-temp").textContent = `${hours[index].temp_f}°`;
        })
        container.querySelectorAll(".forecast-grid div").forEach((div, index) => {
            weatherData.forecast.forecastday.forEach(fd => {
                const maxTemp = fd.day.maxtemp_f;
                const minTemp = fd.day.mintemp_f;
                div.querySelector(".temp-day-night span:first-of-type").textContent = `${maxTemp}°`;
                div.querySelector(".temp-day-night span:last-of-type").textContent = `${minTemp}°`;
            })
        })
    }
    return;
}
/*
   toC():
   - Converts everything back to Celsius
*/

function toC() {
    const container = callingContainer();

    if (container) {
        const hours = weatherData.forecast.forecastday[0].hour;
        container.querySelector(".temp-w-icon h1 i").textContent = `${weatherData.current.temp_c}°`;
        container.querySelector(".info-temp div:first-of-type span:nth-of-type(2)").textContent = `${weatherData.current.feelslike_c}°`;
        container.querySelectorAll(".hourly-menu-list li").forEach((li, index) => {
            li.querySelector(".hour-temp").textContent = `${hours[index].temp_c}°`;
        })
        container.querySelectorAll(".forecast-grid div").forEach((div, index) => {
            weatherData.forecast.forecastday.forEach(fd => {
                const maxTemp = fd.day.maxtemp_c;
                const minTemp = fd.day.mintemp_c;
                div.querySelector(".temp-day-night span:first-of-type").textContent = `${maxTemp}°`;
                div.querySelector(".temp-day-night span:last-of-type").textContent = `${minTemp}°`;
            })
        })
    }
    return;
}

/*
   toMph():
   - Updates wind speed to miles per hour
*/
function toMph() {
    const container = callingContainer()
    if (container) container.querySelector(".info-temp div:nth-of-type(3) span:nth-of-type(2)").textContent = `${weatherData.current.wind_mph} mph`;
    return;
}

/*
   toKm():
   - Updates wind speed to km/h
*/
function toKm() {
    const container = callingContainer()
    if (container) container.querySelector(".info-temp div:nth-of-type(3) span:nth-of-type(2)").textContent = `${weatherData.current.wind_kph} km/h`;
    return;
}

/*
   toInch():
   - Updates precipitation to inches
*/
function toInch() {
    const container = callingContainer()
    if (container) container.querySelector(".info-temp div:last-of-type span:nth-of-type(2)").textContent = `${weatherData.current.precip_in} in`;
    return;
}

/*
   toMm():
   - Updates precipitation to millimeters
*/
function toMm() {
    const container = callingContainer()
    if (container) container.querySelector(".info-temp div:last-of-type span:nth-of-type(2)").textContent = `${weatherData.current.precip_mm} mm`;
    return;
}


/*
   For each unit button:
   - Remove active class from siblings
   - Remove old check icon
   - Add active to clicked button
   - Append check icon dynamically
   - Read data-unit attribute
   - Call appropriate conversion function
*/
unitBtns.forEach(btn => {
    const container = document.querySelector("main");
    btn.addEventListener("click", (e) => {
        const target = e.target;

        const closLi = target.closest("li");
        const liBtns = closLi.querySelectorAll(".btn");

        liBtns.forEach(btn => {
            btn.classList.remove("active");
            const check = btn.querySelector("i");
            if (check) check.remove();
        });

        target.classList.add("active");
        const checkIcon = document.createElement("i");
        checkIcon.className = "fa-solid fa-check";
        target.appendChild(checkIcon);

        const dataUnit = target.dataset.unit;

        /* ===== TEMP ===== */
        if (dataUnit === "fahrenheit") {
            toF();
        }

        if (dataUnit === "celsius") {
            toC();
        }

        /* ===== WIND ===== */
        if (dataUnit === "mph") {
            toMph();
        }

        if (dataUnit === "km") {
            toKm();
        }

        /* ===== PREC ===== */
        if (dataUnit === "inch") {
            toInch();
        }

        if (dataUnit === "millimeters") {
            toMm();
        }
    });

});




