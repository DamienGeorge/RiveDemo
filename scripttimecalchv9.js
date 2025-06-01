//region Timeout Variables
const baseTimeout = 1000;
var timeout = baseTimeout;
var speed = 1;
var multiplier = 10;
//#endregion

//region Mode Variable
var IsDemo = false;
let isStandardLayout = false;

let isAutomaticMode = true;
let toggleIntervalId = null;
//#endregion

//region Global Variables
let storedPosition = null; // Store the position globally
let currentTrScreen = 0;

var spedUpDate = new Date();
let lastToggledDate;
const layoutToggleMap = new Map();
let IsSpedUp = false;
//#endregion

//#region Constants
const stateMachine = "Main state machine";
const toggleInterval = 5; //Determines how often the layout toggles

const slider = document.getElementById('timeSlider');
const sliderValueDisplay = document.getElementById('sliderValue');

const TrTimeTable = 'Tr Timetable';
const TrEmergency = 'Tr Emergency';
const TrImages = 'Tr Images';
const TrTransport = 'Tr Transport';
const TrWeather = 'Tr Weather';

const LayoutVTriggerName = 'Tr Layout V';
const LayoutHTriggerName = 'Tr Layout H';

const EnableSkyTriggerName = 'Tr Sky color';
const EnableWeatherEffectsTriggerName = 'Tr Weather effects';
const SkySunnyTriggerName = 'Tr Sunny';
const SkyRainTriggerName = 'Tr Rain';
//#endregion

//#region Triggers
const layoutVTrigger = document.getElementById('layoutVTrigger');
const layoutHTrigger = document.getElementById('layoutHTrigger');

const trScreens = ['Tr Timetable', 'Tr Emergency', 'Tr Images', 'Tr Transport', 'Tr Weather'];
//#endregion

const riv = new rive.Rive({
    src: "time_main_r4.riv",
    canvas: document.getElementById("canvas"),
    autoplay: true,
    autobind: true,
    artboard: "Time Calc H", // Optional. If not supplied the default is selected
    stateMachines: stateMachine,
    onLoad: () => {
        riv.resizeDrawingSurfaceToCanvas();

        const viewModel = riv.viewModelByIndex(0);
        const viewModelInstance = viewModel.instanceByName('MainInstance');
        riv.bindViewModelInstance(viewModelInstance);

        console.log(viewModelInstance);

        const location = viewModelInstance.string('City Name');

        //input Trigger
        console.log(riv);
        const inputs = riv.stateMachineInputs(stateMachine);
        console.log(inputs);

        //Location logic
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    storedPosition = position; // Store the position
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                    const data = await response.json();
                    console.log(data.address.town);
                    const city = data.address.city || data.address.town;
                    location.value = city;
                },
                (error) => {
                    navigator.permissions.query({ name: 'geolocation' }).then(async result => {
                        if (result.state === 'granted') {
                            navigator.geolocation.getCurrentPosition(
                                async (position) => {
                                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                                    const data = await response.json();
                                    console.log(data.address.town);
                                    const city = data.address.city || data.address.town;
                                    location.value = city;
                                },
                                (error) => {
                                    console.log('Error Getting Location');
                                }
                            );
                        } else {
                            // If geolocation is not available, use IP-based location
                            try {
                                const response = await fetch('https://ipapi.co/json/');
                                const data = await response.json();
                                console.log('Geolocation is not available, using IP-based location', data.city);
                                location.value = data.city;
                            } catch (error) {
                                console.log('Error Getting Location'); // Fallback to London if IP location fails
                            }
                        }
                    });
                }
            );
        }

        var date = new Date();
        startAutoToggle(date);

        // --- Time/Date/Weather update function ---
        function updateRiveTimeAndWeather() {
            let date;
            if (speed !== 1) {
                date = spedUpDate;
            } else {
                date = new Date();
            }

            // 24 hour clock
            const minute = date.getMinutes();
            const hour = date.getHours();

            const minuteInput = viewModelInstance.number('Minute Calc');
            const hourInput = viewModelInstance.number('Hour Calc');

            const yearInput = viewModelInstance.number('Year');
            const monthInput = viewModelInstance.string('Month');
            const dayInput = viewModelInstance.string('Day');
            const dateInput = viewModelInstance.number('Date');

            minuteInput.value = minute;
            hourInput.value = hour;

            yearInput.value = date.getFullYear();
            monthInput.value = date.toLocaleString('default', { month: 'long' });
            dayInput.value = date.toLocaleString('default', { weekday: 'long' });
            dateInput.value = date.getDate();

            // Get weather data and update temperature
            const temperatureInput = viewModelInstance.number('Temperature');
            if (storedPosition) { // Use stored position instead of requesting again
                const lastWeatherUpdate = localStorage.getItem('lastWeatherUpdate') || '0';
                const currentTime = new Date().getTime();
                temperatureInput.value = localStorage.getItem('temperature');
                if (!lastWeatherUpdate || (currentTime - parseInt(lastWeatherUpdate)) >= 300000) { // 300000ms = 5 minutes
                    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${storedPosition.coords.latitude}&longitude=${storedPosition.coords.longitude}&current=temperature_2m`)
                        .then(response => response.json())
                        .then(data => {
                            if (data && data.current && data.current.temperature_2m) {
                                const temp = Math.round(data.current.temperature_2m);
                                temperatureInput.value = temp;
                                localStorage.setItem('lastWeatherUpdate', currentTime.toString());
                                localStorage.setItem('temperature', temp);
                            }
                        })
                        .catch(error => {
                            console.log('Error fetching weather data:', error);
                        });
                }
            }

            // Only call toggleLayout in automatic mode
            if (isAutomaticMode) {
                toggleLayout(date);
            }
        }
        // --- END Time/Date/Weather update function ---

        // Call updateRiveTimeAndWeather every second
        setInterval(updateRiveTimeAndWeather);

        // --- UI BINDINGS: Mode toggle and train toggle buttons ---
        const autoMode = document.getElementById('autoMode');
        const manualMode = document.getElementById('manualMode');

        // Individual train toggle buttons
        const trainToggleButtonsMap = {
            'TrSTableTrigger': TrTimeTable,
            'TrSEmergencyTrigger': TrEmergency,
            'TrSImagesTrigger': TrImages,
            'TrSTransportTrigger': TrTransport,
            'TrSWeatherTrigger': TrWeather
        };

        Object.keys(trainToggleButtonsMap).forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', function (e) {
                    if (!autoMode.checked) { // Only allow in Manual mode
                        const triggerName = trainToggleButtonsMap[btnId];
                        const inputs = riv.stateMachineInputs(stateMachine);
                        const trigger = inputs.find(i => i.name === triggerName);
                        if (trigger) trigger.fire();
                    }
                });
            }
        });
        // --- END UI BINDINGS ---

        // Add event listener for Enable Weather button to fire SkyCloudyTriggerName
        const enableSkyBtn = document.getElementById('enableSkyBtn');
        if (enableSkyBtn) {
            enableSkyBtn.addEventListener('click', function () {
                console.log(inputs);
                const trigger = inputs.find(i => i.name === EnableSkyTriggerName);
                console.log(trigger);
                if (trigger) trigger.fire();
            });
        }

        const enableWeatherEffectsBtn = document.getElementById('enableWeatherBtn');
        if (enableWeatherEffectsBtn) {
            enableWeatherEffectsBtn.addEventListener('click', function () {
                const trigger = inputs.find(i => i.name === EnableWeatherEffectsTriggerName);
                console.log(trigger);
                if (trigger) trigger.fire();
            });
        }

        // Add event listeners for Sunny and Cloudy buttons
        const sunnyBtn = document.getElementById('sunnyBtn');
        if (sunnyBtn) {
            sunnyBtn.addEventListener('click', function () {
                const trigger = inputs.find(i => i.name === SkySunnyTriggerName);
                console.log('Sunny trigger:', trigger);
                if (trigger) trigger.fire();
            });
        }

        const cloudyBtn = document.getElementById('cloudyBtn');
        if (cloudyBtn) {
            cloudyBtn.addEventListener('click', function () {
                const trigger = inputs.find(i => i.name === SkyRainTriggerName);
                console.log('Cloudy trigger:', trigger);
                if (trigger) trigger.fire();
            });
        }

        // Add event listeners for mode toggle radio buttons to update isAutomaticMode
        if (autoMode && manualMode) {
            autoMode.addEventListener('change', function () {
                if (autoMode.checked) isAutomaticMode = true;
            });
            manualMode.addEventListener('change', function () {
                if (manualMode.checked) isAutomaticMode = false;
            });
        }
    }
})

// Neumorphic 3-way speed switch logic
const speedSwitch = document.getElementById('speedSwitch');
const speedThumb = document.getElementById('speedThumb');
const speedLabels = speedSwitch.querySelectorAll('.toggle-label');
const speedValueInput = document.getElementById('speedValue');

// Map speed to index and thumb position
const speedOptions = [1, 5, 10];
let currentSpeedIndex = 0;

function updateSpeedSwitch(index) {
    // Calculate thumb position dynamically
    const switchWidth = speedSwitch.offsetWidth;
    const thumbWidth = speedThumb.offsetWidth;
    const positions = 3;
    const maxTranslate = switchWidth - thumbWidth - 16; // 16px = 8px left + 8px right padding
    const step = maxTranslate / (positions - 1);
    speedThumb.style.transform = `translateX(${index * step}px)`;

    // Highlight label
    speedLabels.forEach((label, i) => {
        label.classList.toggle('active', i === index);
    });
    // Set value and call setSpeed
    speedValueInput.value = speedOptions[index];
    setSpeed(speedOptions[index]);
    currentSpeedIndex = index;
}

// Click handler for labels
speedLabels.forEach((label, i) => {
    label.style.cursor = 'pointer';
    label.addEventListener('click', () => updateSpeedSwitch(i));
});

// Initialize
updateSpeedSwitch(0);



function setSpeed(newSpeed) {
    speed = newSpeed;

    if (speed === 1) {
        IsDemo = false;
        timeout = baseTimeout;
        IsSpedUp = false;
    } else {
        IsDemo = true;
        timeout = (baseTimeout * multiplier) / speed;

        if (!spedUpDate || IsSpedUp === false) {
            spedUpDate = new Date();
            IsSpedUp = true;
        }

        if (window.speedUpTimeout) {
            clearTimeout(window.speedUpTimeout);
        }
        setTimeout(speedUpTime);
    }
    console.log('speed', speed);
}

function speedUpTime() {
    spedUpDate.setMinutes(spedUpDate.getMinutes() + 1);
    window.speedUpTimeout = setTimeout(speedUpTime, timeout);
}

const fireTrigger = (triggerName) => {
    const inputs = riv.stateMachineInputs(stateMachine);

    if (inputs) {
        const trigger = inputs.find(i => i.name === triggerName);
        trigger.fire();
    }
}

/* function handleTrainToggles() {
    const inputs = riv.stateMachineInputs(stateMachine);

    document.querySelectorAll('.dropdown-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.id;
            switch (id) {
                case 'TrSTableTrigger':
                    const timeTableTrigger = inputs.find(i => i.name === TrTimeTable);
                    if (timeTableTrigger) timeTableTrigger.fire();
                    break;
                case 'TrSEmergencyTrigger':
                    const emergencyTrigger = inputs.find(i => i.name === TrEmergency);
                    if (emergencyTrigger) emergencyTrigger.fire();
                    break;
                case 'TrSImagesTrigger':
                    const imagesTrigger = inputs.find(i => i.name === TrImages);
                    if (imagesTrigger) imagesTrigger.fire();
                    break;
                case 'TrSTransportTrigger':
                    const transportTrigger = inputs.find(i => i.name === TrTransport);
                    if (transportTrigger) transportTrigger.fire();
                    break;
                case 'TrSWeatherTrigger':
                    const weatherTrigger = inputs.find(i => i.name === TrWeather);
                    if (weatherTrigger) weatherTrigger.fire();
                    break;
            }
        });
    });
}
 */
function toggleLayout(date) {
    const currentMinute = date.getMinutes();

    if (date.getMinutes() % toggleInterval === 0 && !layoutToggleMap.has(currentMinute)) {
        if (IsDemo || (IsDemo == false && date.getSeconds() === 0)) {

            console.log(isStandardLayout);
            layoutToggleMap.clear();
            layoutToggleMap.set(currentMinute, true);

            if (isStandardLayout || date.getMinutes() % 10 === 0) {
                fireTrigger(LayoutHTriggerName);
                isStandardLayout = true;
            } else {
                console.log('triggering', trScreens[currentTrScreen]);
                fireTrigger(trScreens[currentTrScreen]);
                currentTrScreen = (currentTrScreen + 1) % trScreens.length;
            }
            isStandardLayout = !isStandardLayout;
            lastToggledDate = date;

        }
    }
}

window.addEventListener("resize", () => {
    riv.resizeDrawingSurfaceToCanvas();
});

function startAutoToggle(date) {
    if (toggleIntervalId) clearInterval(toggleIntervalId);
    toggleIntervalId = setInterval(() => {
        if (isAutomaticMode) {
            if (speed !== 1) {
                date = spedUpDate;
            } else {
                date = new Date();
            }
            toggleLayout(date);
        }
    }, 1000); // check every second
}

function stopAutoToggle() {
    if (toggleIntervalId) {
        clearInterval(toggleIntervalId);
        toggleIntervalId = null;
    }
}

// Add event listeners for layout toggle radio buttons
const mainLayoutMode = document.getElementById('mainLayoutMode');
const detailLayoutMode = document.getElementById('detailLayoutMode');

if (mainLayoutMode && detailLayoutMode) {
    mainLayoutMode.addEventListener('change', function () {
        if (mainLayoutMode.checked) {
            fireTrigger(LayoutHTriggerName);
        }
    });
    detailLayoutMode.addEventListener('change', function () {
        if (detailLayoutMode.checked) {
            fireTrigger(LayoutVTriggerName);
        }
    });
} 