const slider = document.getElementById('timeSlider');

const layoutVTrigger = document.getElementById('layoutVTrigger');
const layoutHTrigger = document.getElementById('layoutHTrigger');


const sliderValueDisplay = document.getElementById('sliderValue');

const baseTimeout = 2000;
var timeout = baseTimeout;
var speed = 1;
const multiplier = 1;

const stateMachine = "Main state machine";
const riv = new rive.Rive({
    src: "time_main_23_may.riv",
    canvas: document.getElementById("canvas"),
    autoplay: true,
    autobind: true,
    artboard: "Time Calc H", // Optional. If not supplied the default is selected
    stateMachines: stateMachine,
    onLoad: () => {
        riv.resizeDrawingSurfaceToCanvas();

        // Get reference by index
        for (let i = 0; i < riv.viewModelCount; i++) {
            const indexedVM = riv.viewModelByIndex(i);
            console.log(indexedVM);
        }

        const viewModel = riv.viewModelByIndex(0);
        const viewModelInstance = viewModel.instanceByName('Instance 1');
        riv.bindViewModelInstance(viewModelInstance);

        console.log(viewModelInstance);

        const location = viewModelInstance.string('City Name');


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

        const IncrementTime = () => {
            if (speed !== 1) {
                date.setMinutes(date.getMinutes() + 1);
            }

            setTimeout(IncrementTime, baseTimeout / speed);
        }
        
        var date;
        setInterval(() => {

            if (speed !== 1) {
                const IncrementTime = () => {
                        date.setMinutes(date.getMinutes() + 1);
        
                    setTimeout(IncrementTime, baseTimeout / speed);
                }
            }
            else{
                date= new Date();
            }
            //24 hour clock
            const minute = date.getMinutes();
            const hour = date.getHours();

            const minuteInput = viewModelInstance.number('MC2');
            const hourInput = viewModelInstance.number('Hour Calc 2');

            minuteInput.value = minute;
            hourInput.value = hour;
        })

        IncrementTime();
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

    const trigger = inputs.find(i => i.name === triggerName);
    trigger.fire();
}

const LayoutVTriggerName = 'Layout V';
const LayoutHTriggerName = 'Layout H';

layoutVTrigger.addEventListener('click', (event) => {
    fireTrigger(LayoutVTriggerName);
});

layoutHTrigger.addEventListener('click', (event) => {
    fireTrigger(LayoutHTriggerName);
});

window.addEventListener("resize", () => {
    riv.resizeDrawingSurfaceToCanvas();
}); 