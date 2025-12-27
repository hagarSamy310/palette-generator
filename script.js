const paletteBtn = document.querySelector(".palette-btn");
const colorsCols = document.querySelectorAll(".color");
const errorMsg = document.querySelector(".error-msg");
const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const url = isLocal? "http://colormind.io/api/" : "/api/";

// Initialize the page
generatePalette();

// Press Space key to generate palettes
document.addEventListener("keydown", (e) => {
	if (e.code === "Space") {
		e.preventDefault();
		generatePalette();
	}
});

// Click the button to generate palettes
paletteBtn.addEventListener("click", () => {
	generatePalette();
});

async function generatePalette() {
	const inputArray = Array.from(colorsCols).map((col) => {
		// Check for locked colors
		if (col.dataset.locked === "true") {
			return JSON.parse(col.dataset.rgb);
		} else {
			return "N";
		}
	});
	const data = {
		model: "ui",
		input: inputArray,
	};
	try {
		const response = await fetch(url, {
			method: "POST",
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error("Error fetching colors, Try again later.");
		}
		const res = await response.json();
		const palette = res.result; // Array of 5 arrays

		updateUI(palette);
	} catch (error) {
		errorMsg.textContent = error;
		errorMsg.style.display = "block";
		setTimeout(() => {
			errorMsg.style.display = "none";
		}, 3000);
	}
}

function updateUI(palette) {
	palette.forEach((rgbArray, i) => {
		const [r, g, b] = rgbArray;
		const rgbString = `rgb(${r}, ${g}, ${b})`;
		const colorCol = colorsCols[i];
		colorCol.style.backgroundColor = rgbString;
		// Store color rgb value
		colorCol.dataset.rgb = JSON.stringify(rgbArray);

		// Adjust text color based on brightness
		calculateBrightness(r, g, b, colorCol);

		// Display the color hex value
		const hexString = rgbToHex(r, g, b);
		const colorValue = colorCol.querySelector(".hex-value");
		colorValue.textContent = hexString;
		// Store color hex value
		colorCol.dataset.hex = hexString;

		// Changing a color via the color picker
		const colorPicker = colorCol.querySelector(".color-picker");
		// Inintialize the picker with the curent color
		colorPicker.value = hexString.toLowerCase();

		colorPicker.oninput = (e) => {
			const newColor = e.target.value; // returns a hex value
			colorCol.style.backgroundColor = newColor;
			colorValue.textContent = newColor.toUpperCase();

			// Convert hex to rgb for the API
			const r = parseInt(newColor.slice(1, 3), 16);
			const g = parseInt(newColor.slice(3, 5), 16);
			const b = parseInt(newColor.slice(5, 7), 16);

			// Adjust text color
			calculateBrightness(r, g, b, colorCol);

			// Store the new color data
			colorCol.dataset.rgb = JSON.stringify([r, g, b]);
			colorCol.dataset.hex = newColor.toUpperCase();

			// Automatically lock the picked color
			colorCol.dataset.locked = "true";
			colorCol.querySelector(".lock-btn img").src = "assets/lock.svg";
		};
	});
}

// Convert rgb value to hex
function rgbToHex(r, g, b) {
	const toHex = (n) => n.toString(16).padStart(2, 0);
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// Calculate brightness (Luminance formula)
function calculateBrightness(r, g, b, currentColumn) {
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;
	const details = currentColumn.querySelector(".color-details");
	if (brightness > 125) {
		details.style.color = "black";
		currentColumn.classList.remove("is-dark");
		currentColumn.classList.add("is-light");
	} else {
		details.style.color = "white";
		currentColumn.classList.add("is-dark");
		currentColumn.classList.remove("is-light");
	}
}
// Copy color value to clipboard + Lock a specific color + Color picker
const container = document.querySelector(".container");
container.addEventListener("click", (e) => {
	// Copy to clipboard
	const copyTarget = e.target.closest(".copy-btn");
	if (copyTarget) {
		const currCol = copyTarget.closest(".color");
		const hexValue = currCol.dataset.hex;

		// The Clipboard API
		navigator.clipboard
			.writeText(hexValue)
			.then(() => showCopyFeedback(currCol))
			.catch((err) => console.error("Couldn't copy text: ", err));
	}
	// Lock a certain color
	const locked = e.target.closest(".lock-btn");
	if (locked) {
		const currCol = e.target.closest(".color");
		// Toggle lock state
		const isCurrentlyLocked = currCol.dataset.locked === "true";
		currCol.dataset.locked = isCurrentlyLocked ? "false" : "true";
		// Update lock icon
		locked.querySelector("img").src =
			currCol.dataset.locked === "true"
				? "assets/lock.svg"
				: "assets/lock-open-alt.svg";
	}

	// Choose a different color
	const changeColor = e.target.closest(".hex-value");
	if (changeColor) {
		const currCol = changeColor.closest(".color");
		const colorPicker = currCol.querySelector(".color-picker");
		colorPicker.click();
	}
});

function showCopyFeedback(colorColumn) {
	const feedbackTxt = colorColumn.querySelector(".copied");
	feedbackTxt.style.visibility = "visible";
	setTimeout(() => {
		feedbackTxt.style.visibility = "hidden";
	}, 1000);
}

function attachCustomPicker(colorCol, colorValue) {
  const pickerEl = colorCol.querySelector(".color-picker");

  if (pickerEl._pickr) return; // prevent re-init

  const pickr = Pickr.create({
    el: pickerEl,
    theme: "nano",
    default: pickerEl.value,

    components: {
      preview: false,
      opacity: false,
      hue: true,
      interaction: {
        input: true
      }
    }
  });

  pickerEl._pickr = pickr;

  pickr.on("change", (color) => {
    const hex = color.toHEXA().toString().toUpperCase();
    const rgb = color.toRGBA().slice(0, 3);

    colorCol.style.backgroundColor = hex;
    colorValue.textContent = hex;

    calculateBrightness(rgb[0], rgb[1], rgb[2], colorCol);

    colorCol.dataset.rgb = JSON.stringify(rgb);
    colorCol.dataset.hex = hex;
    colorCol.dataset.locked = "true";
    colorCol.querySelector(".lock-btn img").src = "assets/lock.svg";
  });
}
