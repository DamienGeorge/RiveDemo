const slider = document.getElementById('timeSlider');

const layoutVTrigger = document.getElementById('layoutVTrigger');
const layoutHTrigger = document.getElementById('layoutHTrigger');


const sliderValueDisplay = document.getElementById('sliderValue');

const baseTimeout = 1000;
var timeout = baseTimeout;
var speed = 1;
var multiplier = 10;
var IsDemo = false;

const stateMachine = "Main state machine";
const toggleInterval = 5; //Determines how often the layout toggles
let storedPosition = null; // Store the position globally

const riv = new rive.Rive({
    src: "time_main_25_may.riv",
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

            const minuteInput = viewModelInstance.number('MC2');
            const hourInput = viewModelInstance.number('Hour Calc 2');

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
        setInterval(updateRiveTimeAndWeather, 1000);

        // --- UI BINDINGS: Mode toggle and dropdown ---
        const autoMode = document.getElementById('autoMode');
        const manualMode = document.getElementById('manualMode');
        const trainTogglesDropdown = document.getElementById('trainTogglesDropdown');
        const dropdownItems = document.querySelectorAll('.dropdown-item');

        function setMode() {
            isAutomaticMode = autoMode.checked;
            if (isAutomaticMode) {
                trainTogglesDropdown.classList.add('disabled');
                dropdownItems.forEach(item => item.setAttribute('disabled', 'disabled'));
            } else {
                trainTogglesDropdown.classList.remove('disabled');
                dropdownItems.forEach(item => item.removeAttribute('disabled'));
            }
        }
        autoMode.addEventListener('change', setMode);
        manualMode.addEventListener('change', setMode);
        setMode();

        // Manual mode: fire triggers directly from dropdown
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                if (!isAutomaticMode) {
                    const id = e.target.id;
                    const inputs = riv.stateMachineInputs(stateMachine);
                    switch (id) {
                        case 'TrSTableTrigger':
                            const timeTableTrigger = inputs.find(i => i.name === 'Tr S Timetable');
                            if (timeTableTrigger) timeTableTrigger.fire();
                            break;
                        case 'TrSEmergencyTrigger':
                            const emergencyTrigger = inputs.find(i => i.name === 'Tr S Emergency');
                            if (emergencyTrigger) emergencyTrigger.fire();
                            break;
                        case 'TrSImagesTrigger':
                            const imagesTrigger = inputs.find(i => i.name === 'Tr S Images');
                            if (imagesTrigger) imagesTrigger.fire();
                            break;
                        case 'TrSTransportTrigger':
                            const transportTrigger = inputs.find(i => i.name === 'Tr S Transport');
                            if (transportTrigger) transportTrigger.fire();
                            break;
                    }
                }
            });
        });
        // --- END UI BINDINGS ---
    }
})

var spedUpDate = new Date();
// Update Rive animation when slider changes
slider.addEventListener('input', (event) => {
    const value = parseInt(event.target.value);
    sliderValueDisplay.textContent = value + "x";
    speed = value;

    if (speed === 1) {
        IsDemo = false;
        timeout = baseTimeout;
    }
    else {
        IsDemo = true;
        timeout = (baseTimeout*multiplier)/ speed;
        spedUpDate = new Date();
        if (window.speedUpTimeout) {
            clearTimeout(window.speedUpTimeout);
        }
         setTimeout(speedUpTime);
    }
    
    console.log('speed', speed);
});

function speedUpTime() {
    spedUpDate.setMinutes(spedUpDate.getMinutes() + 1);
    window.speedUpTimeout =setTimeout(speedUpTime,timeout);
}

const fireTrigger = (triggerName) => {
    const inputs = riv.stateMachineInputs(stateMachine);

    if (inputs) {
        const trigger = inputs.find(i => i.name === triggerName);
        trigger.fire();
    }
}

const LayoutVTriggerName = 'Tr Layout V';
const LayoutHTriggerName = 'Tr Layout H';

layoutVTrigger.addEventListener('click', (event) => {
    fireTrigger(LayoutVTriggerName);
});

layoutHTrigger.addEventListener('click', (event) => {
    fireTrigger(LayoutHTriggerName);
});

function handleTrainToggles() {
    const inputs = riv.stateMachineInputs(stateMachine);

    document.querySelectorAll('.dropdown-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.id;
            switch (id) {
                case 'TrSTableTrigger':
                    const timeTableTrigger = inputs.find(i => i.name === 'Tr S Timetable');
                    if (timeTableTrigger) timeTableTrigger.fire();
                    break;
                case 'TrSEmergencyTrigger':
                    const emergencyTrigger = inputs.find(i => i.name === 'Tr S Emergency');
                    if (emergencyTrigger) emergencyTrigger.fire();
                    break;
                case 'TrSImagesTrigger':
                    const imagesTrigger = inputs.find(i => i.name === 'Tr S Images');
                    if (imagesTrigger) imagesTrigger.fire();
                    break;
                case 'TrSTransportTrigger':
                    const transportTrigger = inputs.find(i => i.name === 'Tr S Transport');
                    if (transportTrigger) transportTrigger.fire();
                    break;
            }
        });
    });
}

let isStandardLayout = false;
let currentTrScreen = 0;
const trScreens = ['Tr S Timetable', 'Tr S Emergency', 'Tr S Images', 'Tr S Transport'];

let lastToggledDate;

const layoutToggleMap = new Map();

const toggleLayout = (date) => {
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

let isAutomaticMode = true;
let toggleIntervalId = null;

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