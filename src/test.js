import Map from 'https://smediaapp.pages.dev/src/Map.js';

let map = new Map();

$(document).ready(function () {
  let totalPopulation = 0;

  // Initialize DataTable
  const table = $('#main-data-table').DataTable({
    // Hide the "Show n entries" dropdown and the original search
    lengthChange: false, // Hides the "Show n entries" dropdown
    info: false,
    bPaginate: false,
    dom: 'Bfrtip',
    buttons: ['excel'],
    fnRowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
      // Calculate the correct row number across all pages
      const pageInfo = this.api().page.info();
      const index = pageInfo.start + iDisplayIndex + 1; // Start index + current row index
      $('td:eq(0)', nRow).html(index); // Update the first cell of the row
      return nRow;
    },
  });

  window.mainTable = table;

  function formatNumber(number) {
    if (number === null || number === undefined || isNaN(number)) {
      return '';
    }
    return number.toLocaleString('en-US');
  }

  // Hide the original search input
  $('#main-data-table_filter').hide();

  // Add a custom search input with class .main-table-search
  $('.main-table-search').on('input', function () {
    const searchTerm = $(this).val();
    table.search(searchTerm).draw(); // Perform search with custom input
  });

  // Function to fetch FIPS code for the state
  const getStateFipsCode = (stateName) => {
    return statesFips[stateName]; // Assuming statesFips is accessible
  };

  // Step 2: Function to fetch data for the place
  const fetchPlaceInfo = async (
    stateName,
    placeName,
    closestOffice,
    distanceInMiles
  ) => {
    try {
      // Get the state FIPS code
      const stateFipsCode = getStateFipsCode(stateName.replaceAll(' ', '_'));

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

      // Fetch additional data (population, income, home value, etc.)
      const detailedApiUrl = `https://api.census.gov/data/2022/acs/acs5?get=B01003_001E,B19013_001E,B25077_001E,B25024_002E&for=place:${placeFipsCode}&in=state:${stateFipsCode}&key=8195bcdd0a5f928ee30123f92fdf728a3247dc1c`;
      const detailedResponse = await fetch(detailedApiUrl);
      const detailedData = await detailedResponse.json();

      const [headers, values] = detailedData; // Destructure response into headers and values

      const population = values[0]; // Total population (B01003_001E)
      const medianHouseholdIncome = String(values[1]).includes('-666')
        ? 'No data'
        : values[1]; // Median Household Income (B19013_001E)
      const medianHomeValue = String(values[2]).includes('-666')
        ? 'No data'
        : values[2]; // Median Home Value (B25077_001E)
      const singleFamilyHomes = values[3]; // Single-Family Homes (B25024_002E)

      totalPopulation += Number(population);

      // Determine Total Home Value
      const totalHomeValue =
        medianHomeValue === 'No data'
          ? 'No data'
          : `$${formatNumber(
              Number(medianHomeValue) * Number(singleFamilyHomes)
            )}`;

      // Insert the data into the table
      table.row
        .add([
          '',
          fullPlaceName.split(',')[0].trim(), // City
          stateName, // State
          formatNumber(Number(population)), // Population
          medianHouseholdIncome === 'No data'
            ? 'No data'
            : '$' + formatNumber(Number(medianHouseholdIncome)), // Avg. Household Income
          formatNumber(Number(singleFamilyHomes)), // Approx. # of Single Family Homes
          medianHomeValue === 'No data'
            ? 'No data'
            : '$' + formatNumber(Number(medianHomeValue)), // Avg. Home Value
          totalHomeValue, // Total Home Value
          `${closestOffice} - ${distanceInMiles} miles`, // Closest Office
          '', // % of Total Pop
          '', // Cumulative Pop %
          '', // Total Population
          '', // Norm. Pop
          '', // Norm. Avg. Household Income
          '', // Norm. Approx. # of Single Family Homes
          '', // Norm. Avg. Home Value
          '', // Norm. Closest Office
          '', // Weighted Score
        ])
        .draw(); // Add row and update the table

      // ADD PLACE INTO DB
      // Parse the authToken from localStorage
      const authToken = localStorage.getItem('authToken');

      // Static data to be sent in the request body
      const requestBody = {
        client_id: currentClientId,
        place: fullPlaceName.split(',')[0].trim(),
        state: stateName,
        population: population,
        household_income:
          medianHouseholdIncome === 'No data'
            ? 'No data'
            : '$' + medianHouseholdIncome,
        s_family_home: singleFamilyHomes,
        avg_home_value:
          medianHomeValue === 'No data' ? 'No data' : '$' + medianHomeValue,
        closest_office: `${closestOffice} - ${distanceInMiles} miles`,
      };

      // Make the POST request
      fetch('https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/add_place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(requestBody),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {})
        .catch((error) => {
          console.error('Error:', error);
        });
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  //FULLY DONE
  // Import GraphHopper library (or ensure it's included in your project)

  // Function to calculate the closest office using the GraphHopper API
  async function getClosestOffice(placeLat, placeLon, offices) {
    let closestOffice = null;
    let shortestDistance = Infinity;

    for (const office of offices) {
      const officeData = JSON.parse(office.location.replace(/'/g, '"'));
      const officeLat = parseFloat(officeData.lan);
      const officeLon = parseFloat(officeData.lon);

      const response = await fetch(
        `https://graphhopper.com/api/1/route?point=${placeLat},${placeLon}&point=${officeLat},${officeLon}&vehicle=car&key=9f047c7e-8c26-46e3-8445-51b85d290dfb`
      );

      const data = await response.json();

      if (data.paths && data.paths[0]) {
        const distance = data.paths[0].distance; // Distance in meters

        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestOffice = officeData.office_address;
        }
      }
    }

    return { closestOffice, shortestDistance };
  }

  // Define the function to handle the delete_places request
  async function deletePlaces(clientId, authToken) {
    try {
      const response = await fetch(
        'https://xrux-avyn-v7a8.n7d.xano.io/api:4o1s7k_j/delete_places',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ client_id: clientId }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error in deletePlaces:', error);
      throw error; // Re-throw the error to handle it where called
    }
  }

  $('.submit-selection').on('click', async function () {
    const notificationElement = document.querySelector('.notification');

    // Remove the "active" class from the button
    $(this).removeClass('active');

    table.clear().draw();

    // Save shapes in database
    map.saveMapInDB();

    const stateRows = $('.states_wrap.included .state-row');
    const authToken = localStorage.getItem('authToken');

    // FIRST DELETE ALREADY EXISTING PLACES IN DATABASE FOR THAT CLIENT
    try {
      await deletePlaces(currentClientId, authToken);
    } catch (error) {
      return; // Exit early if deletion fails
    }

    notificationElement.classList.remove('hidden');

    for (let i = 0; i < stateRows.length; i++) {
      notificationElement.textContent = `Generating city/town data - ${i} of ${stateRows.length}`;
      const stateRow = $(stateRows[i]);

      // Extract place information
      const stateNameWithPlace = stateRow
        .find('.state-name-text')
        .text()
        .trim();
      const [placeName, stateName] = stateNameWithPlace
        .split(',')
        .map((part) => part.trim());

      // Extract lat and lon
      const placeLat = parseFloat(stateRow.attr('data-lat'));
      const placeLon = parseFloat(stateRow.attr('data-lon'));

      // Get closest office
      const { closestOffice, shortestDistance } = await getClosestOffice(
        placeLat,
        placeLon,
        userFactors.client_offices
      );

      const distanceInMiles = (shortestDistance / 1609.34).toFixed(2); // Convert meters to miles

      // Optionally, call fetchPlaceInfo if needed
      await fetchPlaceInfo(
        stateName,
        placeName,
        closestOffice,
        distanceInMiles
      );
    }

    document.querySelector(
      '.total-population-element'
    ).textContent = `(${totalPopulation.toLocaleString('en-US')})`;

    // Calculate min and max values for Population, Avg. Household Income, Single Family Homes, Avg. Home Value, and Distance (Miles)
    let minPopulation = Infinity;
    let maxPopulation = -Infinity;
    let minAvgIncome = Infinity;
    let maxAvgIncome = -Infinity;
    let minSingleFamilyHomes = Infinity;
    let maxSingleFamilyHomes = -Infinity;
    let minAvgHomeValue = Infinity;
    let maxAvgHomeValue = -Infinity;
    let minDistance = Infinity;
    let maxDistance = -Infinity;

    const dataRows = table.rows().data();
    dataRows.each((row) => {
      const population = parseInt(row[3].replace(/,/g, ''), 10); // Population
      const avgHouseholdIncome = parseInt(row[4].replace(/[^0-9]/g, ''), 10); // Avg. Household Income
      const singleFamilyHomes = parseInt(row[5].replace(/,/g, ''), 10); // Approx. # of Single Family Homes
      const avgHomeValue = parseInt(row[6].replace(/[^0-9]/g, ''), 10); // Avg. Home Value

      // Extract the distance in miles from data[8]
      const distanceMatch = row[8]?.match(/([\d.]+) miles$/);
      const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 0;

      // Update min and max values
      if (population < minPopulation) minPopulation = population;
      if (population > maxPopulation) maxPopulation = population;

      if (avgHouseholdIncome < minAvgIncome) minAvgIncome = avgHouseholdIncome;
      if (avgHouseholdIncome > maxAvgIncome) maxAvgIncome = avgHouseholdIncome;

      if (singleFamilyHomes < minSingleFamilyHomes)
        minSingleFamilyHomes = singleFamilyHomes;
      if (singleFamilyHomes > maxSingleFamilyHomes)
        maxSingleFamilyHomes = singleFamilyHomes;

      if (avgHomeValue < minAvgHomeValue) minAvgHomeValue = avgHomeValue;
      if (avgHomeValue > maxAvgHomeValue) maxAvgHomeValue = avgHomeValue;

      if (distance < minDistance) minDistance = distance;
      if (distance > maxDistance) maxDistance = distance;
    });

    // Normalize and update data
    let cumulativePercentage = 0;
    table.rows().every(function () {
      const data = this.data();
      const population = parseInt(data[3].replace(/,/g, ''), 10); // Population
      const avgHouseholdIncome = parseInt(data[4].replace(/[^0-9]/g, ''), 10); // Avg. Household Income
      const singleFamilyHomes = parseInt(data[5].replace(/,/g, ''), 10); // Approx. # of Single Family Homes
      const avgHomeValue = parseInt(data[6].replace(/[^0-9]/g, ''), 10); // Avg. Home Value

      const percentage = population / totalPopulation;
      cumulativePercentage += percentage;

      const normalizedPopulation =
        (population - minPopulation) / (maxPopulation - minPopulation);
      const normalizedAvgIncome =
        (avgHouseholdIncome - minAvgIncome) / (maxAvgIncome - minAvgIncome);
      const normalizedSingleFamilyHomes =
        (singleFamilyHomes - minSingleFamilyHomes) /
        (maxSingleFamilyHomes - minSingleFamilyHomes);
      const normalizedAvgHomeValue =
        (avgHomeValue - minAvgHomeValue) / (maxAvgHomeValue - minAvgHomeValue);

      // Extract and normalize distance
      const distanceMatch = data[8]?.match(/([\d.]+) miles$/);
      const distance = distanceMatch ? parseFloat(distanceMatch[1]) : 0;
      const normalizedDistance =
        (distance - minDistance) / (maxDistance - minDistance);

      const weightedScore =
        userFactors.population_factor * (normalizedPopulation || 0) +
        userFactors.avg_household_income_factor * (normalizedAvgIncome || 0) +
        userFactors.single_family_homes_factor *
          (normalizedSingleFamilyHomes || 0) +
        userFactors.avg_home_value_factor * (normalizedAvgHomeValue || 0) +
        userFactors.distance_from_hq_factor * (normalizedDistance || 0);

      data[9] = `${(percentage * 100).toFixed(2)}%`; // % of Total Pop
      data[10] = `${(cumulativePercentage * 100).toFixed(2)}%`; // Cumulative Pop %
      data[12] = normalizedPopulation; // Norm. Pop
      data[13] = normalizedAvgIncome; // Norm. Avg. Household Income
      data[14] = normalizedSingleFamilyHomes; // Norm. Single Family Homes
      data[15] = normalizedAvgHomeValue; // Norm. Avg. Home Value
      data[16] = normalizedDistance || 0; // Norm. Distance (new column)
      data[17] = weightedScore || 0; // Weighted Score

      this.data(data);
    });

    table.order([17, 'desc']).draw();
    notificationElement.classList.add('hidden');
  });
});
