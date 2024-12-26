// Hardcoded variables for now
const stateName = 'Alabama'; // State name
const placeName = 'Birmingham'; // Place name

// Step 1: Get the state FIPS code from the state name
const stateFipsCode = statesFips[stateName];

// Step 2: Fetch data for the place using the provided API
const fetchPlaceInfo = async () => {
  try {
    // API URL for fetching all places in the state
    const apiUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=place:*&in=state:${stateFipsCode}&key=8195bcdd0a5f928ee30123f92fdf728a3247dc1c`;

    // Fetch data
    const response = await fetch(apiUrl);
    const data = await response.json();

    // Find the place (e.g., Birmingham)
    const placeData = data.find((item) => item[0].includes(placeName));

    if (!placeData) {
      console.error('Place not found!');
      return;
    }

    // Extract information
    const fullPlaceName = placeData[0]; // Full name of the place
    const placeFipsCode = placeData[2]; // Place FIPS code

    console.log(`Place: ${fullPlaceName}`);
    console.log(`State FIPS: ${stateFipsCode}`);
    console.log(`Place FIPS: ${placeFipsCode}`);

    // TODO: Use the FIPS codes to fetch additional data (population, income, etc.)
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Call the function to fetch data
document
  .querySelector('.submit-selection')
  .addEventListener('click', fetchPlaceInfo);
