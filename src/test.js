// Hardcoded variables for now
const stateName = "Alabama"; // State name
const placeName = "Birmingham"; // Place name

// Step 1: Get the state FIPS code from the state name
const stateFipsCode = statesFips[stateName];

// Step 2: Fetch data for the place using the Census API
const fetchPlaceData = async () => {
  try {
    // Step 2.1: Fetch Population
    const populationApiUrl = `https://api.census.gov/data/2020/pep/population?get=POP,NAME&for=place:*&in=state:${stateFipsCode}&key=YOUR_CENSUS_API_KEY`;
    const populationResponse = await fetch(populationApiUrl);
    const populationData = await populationResponse.json();

    // Find the place (e.g., Birmingham)
    const placeData = populationData.find((item) => item[1] === placeName);

    if (!placeData) {
      console.error("Place not found!");
      return;
    }

    const population = placeData[0]; // Population
    const placeFipsCode = placeData[3]; // Place FIPS code

    console.log(`Population: ${population}`);

    // Step 2.2: Fetch Average Household Income, Home Value, and Single-Family Homes
    const acsApiUrl = `https://api.census.gov/data/2021/acs/acs5?get=B19013_001E,B25024_002E,B25077_001E&for=place:${placeFipsCode}&in=state:${stateFipsCode}&key=YOUR_CENSUS_API_KEY`;
    const acsResponse = await fetch(acsApiUrl);
    const acsData = await acsResponse.json();

    const [headers, values] = acsData; // Destructure response into headers and data

    const medianHouseholdIncome = values[0]; // Median Household Income
    const singleFamilyHomes = values[1]; // Single-family Homes
    const medianHomeValue = values[2]; // Median Home Value

    console.log(`Median Household Income: $${medianHouseholdIncome}`);
    console.log(`Approx. Single-Family Homes: ${singleFamilyHomes}`);
    console.log(`Median Home Value: $${medianHomeValue}`);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

document.querySelector(".submit-selection").addEventListener("click", fetchPlaceData);
