const slider = document.getElementById('timeSlider');
const sliderValueDisplay = document.getElementById('sliderValue');

const riv = new rive.Rive({
    src: "time_simplified_input.riv",
    canvas: document.getElementById("canvas"),
    autoplay: true,
    autobind: true,
    // artboard: "Arboard", // Optional. If not supplied the default is selected
    stateMachines: "State Machine 1",
    onLoad: () => {
        //const dashboardInstance = riv.viewModelByName("Time");
        const inputs = riv.stateMachineInputs('State Machine 1');
        const minute1Input = inputs.find(i => i.name === 'Minute 1');
        const minute2Input = inputs.find(i => i.name === 'Minute 2');
        const hour1Input = inputs.find(i => i.name === 'Hour 1');
        const hour2Input = inputs.find(i => i.name === 'Hour 2');

        const date = new Date();
        date.setHours(date.getHours()-1);
        date.setMinutes(date.getMinutes()-1);

        const timeout = 1000;
        var speed = 1;
        const multiplier = 1;

        console.log(inputs);

        const updateTime = () => {
            date.setMinutes(date.getMinutes() + speed * multiplier);

            var minute = date.getMinutes().toString().split('')
            var hour = date.getHours().toString().split('')

            minute1Input.value = minute[0]
            minute2Input.value = minute[1];
            hour1Input.value = hour[0]
            hour2Input.value = hour[1];



            console.log('minutes', date.getMinutes());
            console.log('hours', date.getHours());
            console.log(date);

            setTimeout(updateTime, timeout);
        }

        // Update Rive animation when slider changes
        slider.addEventListener('input', (event) => {
            const value = parseInt(event.target.value);
            sliderValueDisplay.textContent = value+"x";
            speed = value;

            console.log('speed', speed);
            updateTime();
        });

        updateTime();

        riv.resizeDrawingSurfaceToCanvas();
    }
})

window.addEventListener("resize", () => {
    riv.resizeDrawingSurfaceToCanvas();
}); 