$(document).ready(function () {
  let totalPopulation = 0;

  // Initialize DataTable
  const table = $('#main-data-table').DataTable({
    // Hide the "Show n entries" dropdown and the original search
    lengthChange: false, // Hides the "Show n entries" dropdown
    info: false,
    bPaginate: false,
    fnRowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
      // Calculate the correct row number across all pages
      const pageInfo = this.api().page.info();
      const index = pageInfo.start + iDisplayIndex + 1; // Start index + current row index
      $('td:eq(0)', nRow).html(index); // Update the first cell of the row
      return nRow;
    },
  });

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

  function formatNumber(number) {
    if (number === null || number === undefined || isNaN(number)) {
      return '';
    }
    return number.toLocaleString('en-US');
  }

  // Step 2: Function to fetch data for the place
  const fetchPlaceInfo = async (stateName, placeName) => {
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
      const medianHouseholdIncome = values[1]; // Median Household Income (B19013_001E)
      const medianHomeValue = String(values[2]).includes('-666')
        ? 'No data'
        : '$' + formatNumber(Number(values[2])); // Median Home Value (B25077_001E)
      const singleFamilyHomes = values[3]; // Single-Family Homes (B25024_002E)
      const totalHomeValue =
        medianHomeValue === 'No data'
          ? 'No data'
          : `$${formatNumber(
              Number(medianHomeValue) * Number(singleFamilyHomes)
            )}`; // Total Home Value

      totalPopulation += Number(population);

      // Insert the data into the table
      table.row
        .add([
          '',
          fullPlaceName, // City
          stateName, // State
          formatNumber(Number(population)), // Population
          '$' + formatNumber(Number(medianHouseholdIncome)), // Avg. Household Income
          formatNumber(Number(singleFamilyHomes)), // Approx. # of Single Family Homes
          medianHomeValue, // Avg. Home Value
          totalHomeValue, // Total Home Value
          '', // Closest Office
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
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  // Step 3: Loop through all the selected places and fetch data
  $('.submit-selection').on('click', async function () {
    const notificationElement = document.querySelector('.notification');
    notificationElement.textContent = 'Generating city/town data...';
    notificationElement.classList.remove('hidden');

    table.clear().draw();

    const stateRows = $('.states_wrap.included .state-row');
    for (let i = 0; i < stateRows.length; i++) {
      const stateNameWithPlace = $(stateRows[i])
        .find('.state-name-text')
        .text()
        .trim();
      const [placeName, stateName] = stateNameWithPlace
        .split(',')
        .map((part) => part.trim());

      await fetchPlaceInfo(stateName, placeName);
    }

    document.querySelector(
      '.total-population-element'
    ).textContent = `(${totalPopulation.toLocaleString('en-US')})`;

    // Calculate min and max values for Population, Avg. Household Income, Single Family Homes, and Avg. Home Value
    let minPopulation = Infinity;
    let maxPopulation = -Infinity;
    let minAvgIncome = Infinity;
    let maxAvgIncome = -Infinity;
    let minSingleFamilyHomes = Infinity;
    let maxSingleFamilyHomes = -Infinity;
    let minAvgHomeValue = Infinity;
    let maxAvgHomeValue = -Infinity;

    const dataRows = table.rows().data();
    dataRows.each((row) => {
      const population = parseInt(row[3].replace(/,/g, ''), 10); // Population
      const avgHouseholdIncome = parseInt(row[4].replace(/[^0-9]/g, ''), 10); // Avg. Household Income (remove $ and commas)
      const singleFamilyHomes = parseInt(row[5].replace(/,/g, ''), 10); // Approx. # of Single Family Homes
      const avgHomeValue = parseInt(row[6].replace(/[^0-9]/g, ''), 10); // Avg. Home Value (remove $ and commas)

      // Update min and max for population
      if (population < minPopulation) minPopulation = population;
      if (population > maxPopulation) maxPopulation = population;

      // Update min and max for Avg. Household Income
      if (avgHouseholdIncome < minAvgIncome) minAvgIncome = avgHouseholdIncome;
      if (avgHouseholdIncome > maxAvgIncome) maxAvgIncome = avgHouseholdIncome;

      // Update min and max for Single Family Homes
      if (singleFamilyHomes < minSingleFamilyHomes)
        minSingleFamilyHomes = singleFamilyHomes;
      if (singleFamilyHomes > maxSingleFamilyHomes)
        maxSingleFamilyHomes = singleFamilyHomes;

      // Update min and max for Avg. Home Value
      if (avgHomeValue < minAvgHomeValue) minAvgHomeValue = avgHomeValue;
      if (avgHomeValue > maxAvgHomeValue) maxAvgHomeValue = avgHomeValue;
    });

    // Update % of Total Pop, Cumulative Pop %, Norm. Pop, Norm. Avg. Household Income, Norm. Single Family Homes, and Norm. Avg. Home Value
    let cumulativePercentage = 0;
    table.rows().every(function () {
      const data = this.data();
      const population = parseInt(data[3].replace(/,/g, ''), 10); // Population
      const avgHouseholdIncome = parseInt(data[4].replace(/[^0-9]/g, ''), 10); // Avg. Household Income
      const singleFamilyHomes = parseInt(data[5].replace(/,/g, ''), 10); // Approx. # of Single Family Homes
      const avgHomeValue = parseInt(data[6].replace(/[^0-9]/g, ''), 10); // Avg. Home Value

      // % of Total Pop
      const percentage = population / totalPopulation;

      // Cumulative Pop %
      cumulativePercentage += percentage;

      // Norm. Pop
      const normalizedPopulation =
        (population - minPopulation) / (maxPopulation - minPopulation);

      // Norm. Avg. Household Income
      const normalizedAvgIncome =
        (avgHouseholdIncome - minAvgIncome) / (maxAvgIncome - minAvgIncome);

      // Norm. Single Family Homes
      const normalizedSingleFamilyHomes =
        (singleFamilyHomes - minSingleFamilyHomes) /
        (maxSingleFamilyHomes - minSingleFamilyHomes);

      // Norm. Avg. Home Value
      const normalizedAvgHomeValue =
        (avgHomeValue - minAvgHomeValue) / (maxAvgHomeValue - minAvgHomeValue);

      // Update the row data
      data[9] = `${(percentage * 100).toFixed(2)}%`; // % of Total Pop
      data[10] = `${(cumulativePercentage * 100).toFixed(2)}%`; // Cumulative Pop %
      data[12] = normalizedPopulation; // Norm. Pop
      data[13] = normalizedAvgIncome; // Norm. Avg. Household Income
      data[14] = normalizedSingleFamilyHomes; // Norm. Single Family Homes
      data[15] = normalizedAvgHomeValue; // Norm. Avg. Home Value

      this.data(data);
    });

    table.draw();
    notificationElement.classList.add('hidden');
  });
});
