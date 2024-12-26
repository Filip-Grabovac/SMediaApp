$(document).ready(function () {
  // Initialize DataTable
  const table = $('#main-data-table').DataTable();

  // Function to fetch FIPS code for the state
  const getStateFipsCode = (stateName) => {
    return statesFips[stateName];
  };

  // Step 2: Function to fetch data for the place
  const fetchPlaceInfo = async (stateName, placeName) => {
    try {
      // Get the state FIPS code
      const stateFipsCode = getStateFipsCode(stateName);

      if (!stateFipsCode) {
        console.error('State FIPS code not found!');
        return;
      }

      // Fetch all places in the state
      const apiUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=place:*&in=state:${stateFipsCode}&key=8195bcdd0a5f928ee30123f92fdf728a3247dc1c`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      // Find the place
      const placeData = data.find((item) => item[0].includes(placeName));

      if (!placeData) {
        console.error('Place not found!');
        return;
      }

      const fullPlaceName = placeData[0]; // Full name of the place
      const placeFipsCode = placeData[2]; // Place FIPS code

      console.log(`Place: ${fullPlaceName}`);
      console.log(`State FIPS: ${stateFipsCode}`);
      console.log(`Place FIPS: ${placeFipsCode}`);

      // Fetch additional data (population, income, home value, etc.)
      const detailedApiUrl = `https://api.census.gov/data/2022/acs/acs5?get=B01003_001E,B19013_001E,B25077_001E,B25024_002E&for=place:${placeFipsCode}&in=state:${stateFipsCode}&key=8195bcdd0a5f928ee30123f92fdf728a3247dc1c`;
      const detailedResponse = await fetch(detailedApiUrl);
      const detailedData = await detailedResponse.json();

      const [headers, values] = detailedData; // Destructure response into headers and values

      const population = values[0]; // Total population (B01003_001E)
      const medianHouseholdIncome = values[1]; // Median Household Income (B19013_001E)
      const medianHomeValue = values[2]; // Median Home Value (B25077_001E)
      const singleFamilyHomes = values[3]; // Single-Family Homes (B25024_002E)

      console.log(`Population: ${population}`);
      console.log(`Median Household Income: ${medianHouseholdIncome}`);
      console.log(`Median Home Value: ${medianHomeValue}`);
      console.log(`Approx. Single-Family Homes: ${singleFamilyHomes}`);

      // Insert the data into the table (only first 6 columns)
      const totalHomeValue = medianHomeValue * singleFamilyHomes;
      const closestOffice = ''; // Placeholder for now
      const percentageOfTotalPop = ''; // Placeholder for now
      const cumulativePop = ''; // Placeholder for now

      // Insert the data into the table
      table.row
        .add([
          fullPlaceName, // City
          stateName, // State
          population, // Population
          medianHouseholdIncome, // Avg. Household Income
          singleFamilyHomes, // Approx. # of Single Family Homes
          medianHomeValue, // Avg. Home Value
          '', // Total Home Value (Empty for now)
          '', // Closest Office (Empty for now)
          '', // % of Total Pop (Empty for now)
          '', // Cumulative Pop (Empty for now)
          '', // Total Population (Empty for now)
          '', // Norm. Pop. (Empty for now)
          '', // Norm. Avg. Household Income (Empty for now)
          '', // Norm. Approx. # of Single Family Homes (Empty for now)
          '', // Norm. Avg. Home Value (Empty for now)
          '', // Norm. Closest Office (Empty for now)
          '', // Weighted Score (Empty for now)
        ])
        .draw(); // Add row and update the table
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Step 3: Loop through all the selected places and fetch data
  $('.submit-selection').on('click', async function () {
    console.log("Cliked");
    // Clear the table first
    table.clear().draw();

    // Loop through each .state-row in the .included div
    $('.states_wrap .included .state-row').each(async function () {
      const stateNameWithPlace = $(this).find('.state-name-text').text().trim();
      const [placeName, stateName] = stateNameWithPlace
        .split(',')
        .map((part) => part.trim());

      // Fetch data for this place and state
      await fetchPlaceInfo(stateName, placeName);
    });
  });
});
