const slider = document.getElementById('timeSlider');

const layoutVTrigger = document.getElementById('layoutVTrigger');
const layoutHTrigger = document.getElementById('layoutHTrigger');


const sliderValueDisplay = document.getElementById('sliderValue');

const stateMachine = "Main state machine";
const riv = new rive.Rive({
    src: "time_main_23_may.riv",
    canvas: document.getElementById("canvas"),
    autoplay: true,
    autobind: true,
    artboard: "Time Calc H", // Optional. If not supplied the default is selected
    stateMachines: stateMachine,
    onLoad: () => {
        delay(1000)

        riv.resizeDrawingSurfaceToCanvas();
    }
})

// Update Rive animation when slider changes
slider.addEventListener('input', (event) => {
    const value = parseInt(event.target.value);
    sliderValueDisplay.textContent = value+"x";
    speed = value;

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