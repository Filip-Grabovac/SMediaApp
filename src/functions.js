/**
 * THIS FILE HANDLES ALL REPETATIVE AND SMALL FUNCTIONS
 */

const icons = document.querySelectorAll('.tool-wrapper .map-manipulation__icon');

function colorRandomizer() {
  let userColors = [
    '#CBE4F9',
    '#CDF5F6',
    '#EFF9DA',
    '#F9EBDF',
    '#F9D8D6',
    '#D6CDEA',
  ];

  return userColors[Math.floor(Math.random() * userColors.length)];
}

window.colorRandomizer = colorRandomizer;

// Add click event to map tool
icons.forEach(function(icon) {
  icon.addEventListener('click', function() {
    // Remove 'active' class from all .tool-wrapper elements
    document.querySelectorAll('.tool-wrapper').forEach(function(wrapper) {
      wrapper.classList.remove('active');
    });

    // Add 'active' class to the parent .tool-wrapper of the clicked icon
    this.closest('.tool-wrapper').classList.add('active');
  });
});