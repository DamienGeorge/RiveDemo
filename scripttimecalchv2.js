const slider = document.getElementById('timeSlider');

const layoutVTrigger = document.getElementById('layoutVTrigger');
const layoutHTrigger = document.getElementById('layoutHTrigger');


const sliderValueDisplay = document.getElementById('sliderValue');

const baseTimeout = 2000;
var timeout = baseTimeout;
var speed = 1;
const multiplier = 1;

const stateMachine = "Main state machine";
const toggleInterval = 1;

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

        //const location = viewModelInstance.string('City Name');

        //input Trigger
        console.log(riv);
        const inputs = riv.stateMachineInputs(stateMachine);
        console.log(inputs);

        //Location logic
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
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


        var date;
        setInterval(() => {

            if (speed !== 1) {
                const IncrementTime = () => {
                    date.setMinutes(date.getMinutes() + 1);

                    setTimeout(IncrementTime, baseTimeout / speed);
                }
            }
            else {
                date = new Date();
            }
            //console.log(date);
            //24 hour clock
            const minute = date.getMinutes();
            const hour = date.getHours();

            const minuteInput = viewModelInstance.number('MC2');
            const hourInput = viewModelInstance.number('Hour Calc 2');

            minuteInput.value = minute;
            hourInput.value = hour;
        })

    }
})

// Update Rive animation when slider changes
slider.addEventListener('input', (event) => {
    const value = parseInt(event.target.value);
    sliderValueDisplay.textContent = value + "x";
    speed = value;
    timeout = baseTimeout / (speed * 10);
    console.log('speed', speed);
    //updateTime();
});


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

let isStandardLayout = true;
let currentTrScreen = 0;
const trScreens = ['Tr S Timetable', 'Tr S Emergency', 'Tr S Images', 'Tr S Transport'];

let lastToggledDate;

const toggleLayout = (date) => {
    
    const layoutToggleMap = new Map();
    const currentMinute = date.getMinutes();
    
    if (date.getMinutes() % toggleInterval === 0 && date.getSeconds() === 0 && !layoutToggleMap.has(currentMinute)) {
        console.log(isStandardLayout);
        layoutToggleMap.clear(); // Clear previous entries
        layoutToggleMap.set(currentMinute, true);

        if (isStandardLayout || date.getMinutes() % 10 === 0) {
            fireTrigger(LayoutHTriggerName); // Standard layout
            isStandardLayout = true;
        } else {
            console.log('triggering', trScreens[currentTrScreen]);
            fireTrigger(trScreens[currentTrScreen]); // Cycle through Tr S screens
            currentTrScreen = (currentTrScreen + 1) % trScreens.length;
        }
        isStandardLayout = !isStandardLayout;
        lastToggledDate = date;
    }

}

setInterval(() => {
    toggleLayout(new Date());
}, 1000);

window.addEventListener("resize", () => {
    riv.resizeDrawingSurfaceToCanvas();
}); 