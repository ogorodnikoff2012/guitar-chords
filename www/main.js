class GuitarController {
    static STRING_NUMBER_WIDTH = 50;
    static TITLE_HEIGHT = 70;
    static FRET_WIDTH = 100;
    static STRING_HEIGHT = 50;
    static FINGER_COUNT = 4;
    static FINGER_STYLE = [
        { color: "red", textColor: "black" },
        { color: "orange", textColor: "black" },
        { color: "lightgreen", textColor: "black" },
        { color: "blue", textColor: "white" },
    ];

    constructor({canvas, form}) {
        this.canvas = canvas;
        this.form = form;
    }

    init() {
        this.pullConfigFromLocalStorage();
        this.subscribeOnInputEvents();
        this.applySettingsFromView();
    }

    updateView() {
        this.pushConfigToLocalStorage();
        this.updateCanvasSize();
        this.renderOnCanvas();
    }

    subscribeOnInputEvents() {
        for (let id of ['chord-name', 'finger0', 'finger1', 'finger2', 'finger3', 'fret-count', 'string-count']) {
            this.form.elements[id].addEventListener("input", () => this.applySettingsFromView());
        }

        this.form.elements['reset-finger'].addEventListener('click', () => this.resetCurrentFinger());
        this.form.elements['reset-all'].addEventListener('click', () => this.resetAllFingers());
        this.form.elements['save-png'].addEventListener('click', () => this.downloadAsPNG());

        this.canvas.addEventListener('click', e => this.handleClickOnCanvas(e));
    }

    renderOnCanvas() {
        const ctx = this.canvas.getContext("2d");

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawTitle(ctx);
        ctx.save();
        ctx.translate(0, GuitarController.TITLE_HEIGHT);
        this.drawStrings(ctx);
        this.drawFrets(ctx);
        this.drawFingers(ctx);
        ctx.restore();
    }

    drawTitle(ctx) {
        ctx.fillStyle = "black";
        ctx.font = "48px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.chordName, this.canvas.width / 2, GuitarController.TITLE_HEIGHT / 2);
    }

    drawStrings(ctx) {
        for (let i = 0; i < this.stringCount; i++) {
            this.drawString(ctx, i);
        }
    }

    drawFrets(ctx) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        ctx.font = "12px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let i = 0; i <= this.fretCount; i++) {
            ctx.beginPath();
            ctx.moveTo(GuitarController.STRING_NUMBER_WIDTH + i * GuitarController.FRET_WIDTH, GuitarController.STRING_HEIGHT * 0.5);
            ctx.lineTo(GuitarController.STRING_NUMBER_WIDTH + i * GuitarController.FRET_WIDTH, GuitarController.STRING_HEIGHT * (this.stringCount - 0.5));
            ctx.stroke();

            if (i === 0) {
                continue;
            }

            ctx.fillText(i, GuitarController.STRING_NUMBER_WIDTH + (i - 0.5) * GuitarController.FRET_WIDTH, 0.25 * GuitarController.STRING_HEIGHT);
        }
    }

    drawFingers(ctx) {
        for (let i = 0; i < GuitarController.FINGER_COUNT; i++) {
            this.drawFinger(ctx, i, this.fingers[i], GuitarController.FINGER_STYLE[i]);
        }
    }

    drawString(ctx, stringIdx) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";

        const yCenter = GuitarController.STRING_HEIGHT * (stringIdx + 0.5);

        ctx.beginPath();
        ctx.moveTo(GuitarController.STRING_NUMBER_WIDTH, yCenter);
        ctx.lineTo(this.canvas.width, yCenter);
        ctx.stroke();

        ctx.font = "20px serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(stringIdx + 1, GuitarController.STRING_NUMBER_WIDTH / 2, yCenter);

        const radius = 0.625 * Math.min(GuitarController.STRING_NUMBER_WIDTH, GuitarController.STRING_HEIGHT) / 2;
        ctx.beginPath();
        ctx.ellipse(GuitarController.STRING_NUMBER_WIDTH / 2, yCenter, radius, radius, 0, 0, 2 * Math.PI);
        ctx.stroke();
    }

    pullConfigFromLocalStorage() {
        this.stringCount = +(localStorage.getItem("GUITAR_CHORD_PICKER__STRING_COUNT") || 6);
        this.fretCount = +(localStorage.getItem("GUITAR_CHORD_PICKER__FRET_COUNT") || 6);
        this.fingers = JSON.parse(localStorage.getItem("GUITAR_CHORD_PICKER__FINGERS") || "[{},{},{},{}]");
        this.chordName = localStorage.getItem("GUITAR_CHORD_PICKER__CHORD_NAME") || "";
        this.pushSettingsToView();
    }

    pushConfigToLocalStorage() {
        localStorage.setItem("GUITAR_CHORD_PICKER__STRING_COUNT", this.stringCount);
        localStorage.setItem("GUITAR_CHORD_PICKER__FRET_COUNT", this.fretCount);
        localStorage.setItem("GUITAR_CHORD_PICKER__FINGERS", JSON.stringify(this.fingers));
        localStorage.setItem("GUITAR_CHORD_PICKER__CHORD_NAME", this.chordName);
    }

    updateCanvasSize() {
        const {width, height} = this.computeCanvasSize();
        this.canvas.width = width;
        this.canvas.height = height;
    }

    computeCanvasSize() {
        const width = (this.fretCount + 0.5) * GuitarController.FRET_WIDTH + GuitarController.STRING_NUMBER_WIDTH;
        const height = GuitarController.TITLE_HEIGHT + this.stringCount * GuitarController.STRING_HEIGHT;
        return {width, height};
    }

    drawFinger(ctx, fingerIdx, placements, style) {
        const stringIndices = Object.keys(placements).map(Number).sort((a, b) => a - b);
        const fretIndices = stringIndices.map(idx => placements[idx]);

        const xs = fretIndices.map(idx => GuitarController.STRING_NUMBER_WIDTH + GuitarController.FRET_WIDTH * (idx + 0.8));
        const ys = stringIndices.map(idx => GuitarController.STRING_HEIGHT * (idx + 0.5));

        if (xs.length >= 2) {
            ctx.lineWidth = 5;
            ctx.strokeStyle = style.color;

            ctx.beginPath();

            ctx.moveTo(xs[0], ys[0]);
            for (let i = 1; i < xs.length; ++i) {
                ctx.lineTo(xs[i], ys[i]);
            }

            ctx.stroke();
        }

        for (let i = 0; i < xs.length; ++i) {
            ctx.fillStyle = style.color;
            ctx.beginPath();
            const radius = 0.5 * Math.min(GuitarController.STRING_NUMBER_WIDTH, GuitarController.STRING_HEIGHT) / 2;
            ctx.ellipse(xs[i], ys[i], radius, radius, 0, 0, 2 * Math.PI);
            ctx.fill();

            ctx.fillStyle = style.textColor;
            ctx.font = "20px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(fingerIdx + 1, xs[i], ys[i]);
        }
    }

    applySettingsFromView() {
        this.chordName = this.form.elements['chord-name'].value || '';
        this.currentFinger = +this.form.elements['finger'].value;
        this.fretCount = this.form.elements['fret-count'].valueAsNumber;
        this.stringCount = this.form.elements['string-count'].valueAsNumber;

        this.updateView();
    }

    pushSettingsToView() {
        this.form.elements['chord-name'].value = this.chordName || '';
        this.form.elements['finger'].value = this.currentFinger || 0;
        this.form.elements['fret-count'].value = this.fretCount;
        this.form.elements['string-count'].value = this.stringCount;
    }

    resetCurrentFinger() {
        this.fingers[this.currentFinger] = {};
        this.updateView();
    }

    resetAllFingers() {
        this.fingers = new Array(GuitarController.FINGER_COUNT);
        for (let i = 0; i < this.fingers.length; i++) {
            this.fingers[i] = {};
        }
        this.updateView();
    }

    handleClickOnCanvas(e) {
        const x = e.clientX - e.target.getBoundingClientRect().left;
        const y = e.clientY - e.target.getBoundingClientRect().top;

        const stringIdx = Math.floor((y - GuitarController.TITLE_HEIGHT) / GuitarController.STRING_HEIGHT);
        const fretIdx = Math.floor((x - GuitarController.STRING_NUMBER_WIDTH) / GuitarController.FRET_WIDTH);

        if (stringIdx < 0 || stringIdx >= this.stringCount) {
            return false;
        }
        if (fretIdx < 0 || fretIdx >= this.fretCount) {
            return false;
        }

        if (this.fingers[this.currentFinger][stringIdx] === fretIdx) {
            delete this.fingers[this.currentFinger][stringIdx];
        } else {
            this.fingers[this.currentFinger][stringIdx] = fretIdx;
        }

        this.updateView();

        return false;
    }

    downloadAsPNG() {
        const downloadLink = document.createElement('a');
        downloadLink.setAttribute('download', (this.chordName.toString().replace('#', ' sharp ').trim().replace(/\W+/g, '_') || 'chord') + '.png');
        this.canvas.toBlob((blob) => {
           const url = URL.createObjectURL(blob);
           downloadLink.setAttribute('href', url);
           downloadLink.click();
        });
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("canvas");
    const form = document.getElementById("menu-form");
    const controller = new GuitarController({canvas, form});
    controller.init();
    window.guitarController = controller;
});
