const paletteBtn = document.querySelector(".palette-btn");
const colorsCols = document.querySelectorAll(".color");
const errorMsg = document.querySelector(".error-msg");
const url = "https://api.huemint.com/color";
let demoWindow = null;

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
	const paletteInput = Array.from(colorsCols).map((col) => {
		// Check for locked colors
		if (col.dataset.locked === "true") {
			return col.dataset.hex;
		} else {
			return "-";
		}
	});
	const data = {
		"mode": "diffusion",  // AI mode 
		"num_colors": 5,
		"temperature": "0.8",
		"num_results": 1,
		"adjacency": [
			"0", "75", "45", "45", "45",
			"75", "0", "0", "0", "0",
			"45", "0", "0", "30", "0",
			"45", "0", "30", "0", "30",
			"45", "0", "0", "30", "0"
		],

		"palette": paletteInput,
	};

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data),
		});
		if (!response.ok) {
			throw new Error("Error fetching colors, Try again later.");
		}
		const result = await response.json();
		const palette = result.results[0].palette; // Array of hex colors

		updateUI(palette);

	} catch (error) {
		errorMsg.textContent = 'Error fetching colors, Try again later.';
		console.error(error.message);
		errorMsg.style.display = "block";
		setTimeout(() => {
			errorMsg.style.display = "none";
		}, 3000);
	}
}

function updateUI(palette) {
	palette.forEach((hex, i) => {
		const colorCol = colorsCols[i];
		// Skip if locked
		if (colorCol.dataset.locked === "true") {
			return;
		}
		// Store color hex value
		colorCol.dataset.hex = hex.toUpperCase();

		// Display color hex value and apply background color
		colorCol.style.backgroundColor = hex;
		const colorValue = colorCol.querySelector(".hex-value");
		colorValue.textContent = hex.toUpperCase();
		const rgb = hexToRGB(hex);
		// Store color rgb value
		colorCol.dataset.rgb = JSON.stringify(rgb);
		// Adjust text color based on brightness
		calculateBrightness(rgb[0], rgb[1], rgb[2], colorCol);
		initializePickr(colorCol, hex);
	});
	sendColorsToDemoPage();
}

function hexToRGB(hexColor) {
	const r = parseInt(hexColor.slice(1, 3), 16);
	const g = parseInt(hexColor.slice(3, 5), 16);
	const b = parseInt(hexColor.slice(5, 7), 16);
	return [r, g, b];
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
		const currentHex = currCol.dataset.hex;
		if (!currCol._pickr) {
			initializePickr(currCol, currentHex);
		}
		currCol._pickr.show();
	}
});

function showCopyFeedback(colorColumn) {
	const feedbackTxt = colorColumn.querySelector(".copied");
	feedbackTxt.style.visibility = "visible";
	setTimeout(() => {
		feedbackTxt.style.visibility = "hidden";
	}, 1000);
}

function initializePickr(colorCol, hex) {
	const colorPicker = colorCol.querySelector(".color-picker");
	// Prevent re-initialization
	if (colorCol._pickr) {
		colorCol._pickr.setColor(hex);
		return;
	}
	// Create Pickr instance
	const pickr = Pickr.create({
		el: colorPicker,
		theme: 'nano',
		default: hex,
		components: {
			preview: true,
			opacity: false,
			hue: true,
			interaction: {
				hex: true,
				rgba: true,
				hsla: true,
				input: true,
				save: false,
				clear: false
			}
		},
		autoReposition: true,
		closeWithKey: 'Escape',
		container: colorCol,
	});

	// Store pickr instance  
	colorCol._pickr = pickr;

	// Handle color change
	pickr.on('change', (color, source) => {
		const newHex = color.toHEXA().toString().toUpperCase();
		const rgb = hexToRGB(newHex);
		// Update UI
		colorCol.style.backgroundColor = newHex;
		colorCol.querySelector('.hex-value').textContent = newHex;
		calculateBrightness(rgb[0], rgb[1], rgb[2], colorCol);

		// Store data
		colorCol.dataset.hex = newHex;
		colorCol.dataset.rgb = JSON.stringify(rgb);

		// Auto-lock color >> only if change comes from user interaction 
		if (source === "slider" || source === "input") {
			colorCol.dataset.locked = "true";
			colorCol.querySelector(".lock-btn img").src = "assets/lock.svg";
		}
		sendColorsToDemoPage();
	})
}

// Sending updated colors to demo page 
document.querySelector('.demo').addEventListener('click', (e) => {
	e.preventDefault();
	const colors = Array.from(colorsCols).map(color => color.dataset.hex).join(',');
	demoWindow = window.open(`demo.html?colors=${encodeURIComponent(colors)}`, '_blank');
})

function sendColorsToDemoPage() {
	if (demoWindow && !demoWindow.closed) {
		// Check if window is loaded 
		if (demoWindow.document.readyState === 'complete') {
			const colors = Array.from(colorsCols).map(color => color.dataset.hex);
			demoWindow.postMessage({ colors: colors }, '*');
		}
	}
}