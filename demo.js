const params = new URLSearchParams(window.location.search);
const colorsParams = params.get('colors');
const colors =  colorsParams?.split(',') || [];
//  Visulaizing colors on a demo UI
function updateDemoPage(colors) {
  if(colors.length > 0) {
    // Update Background
    const bodyEl = document.querySelector('body');
    bodyEl.style.backgroundColor = `${colors[0]}`;

    // Update  Main Color
    bodyEl.style.color = `${colors[1]}`;  // Text
    const navbarLinks = Array.from(document.querySelectorAll('nav a'));  // Navbar
    navbarLinks.forEach(link => {
      link.style.color = `${colors[1]}`;
    });
    const socialLinks = Array.from(document.querySelectorAll('.social-links a'));  // Social Links
    socialLinks.forEach(link => {
      link.style.color = `${colors[1]}`;
    });
    // Update 2 Circles
    document.querySelector('.circle2').style.backgroundColor = `${colors[2]}`;
    document.querySelector('.circle1').style.backgroundColor = `${colors[3]}`;
    // Update 2 span words
    document.querySelector('.different-color1').style.color = `${colors[2]}`;
    document.querySelector('.different-color2').style.color = `${colors[3]}`;
    // Update CTA Button
    document.querySelector('.cta').style.backgroundColor = `${colors[4]}`;
    document.querySelector('.cta').style.color = `${colors[1]}`;
  }
}

updateDemoPage(colors);

// Listen or live updates 
window.addEventListener('message', (e) => {
  if(e.data.colors) {
    updateDemoPage(e.data.colors);
  }
})