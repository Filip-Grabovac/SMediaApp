$(document).ready(function () {
  // Initialize DataTable
  const table = $('#main-data-table').DataTable({
    lengthChange: false, // Hides the "Show n entries" dropdown
    info: false,
    fnRowCallback: function (nRow, aData, iDisplayIndex, iDisplayIndexFull) {
      const pageInfo = this.api().page.info();
      const index = pageInfo.start + iDisplayIndex + 1; // Start index + current row index
      $('td:eq(0)', nRow).html(index); // Update the first cell of the row
      return nRow;
    },
  });

  // Hide the original search input
  $('#main-data-table_filter').hide();

  // Custom search input
  $('.main-table-search').on('input', function () {
    const searchTerm = $(this).val();
    table.search(searchTerm).draw();
  });

  // Custom pagination
  $('.pagination-arrow.left').on('click', function () {
    table.page('previous').draw('page');
    updatePaginationInfo();
  });

  $('.pagination-arrow.right').on('click', function () {
    table.page('next').draw('page');
    updatePaginationInfo();
  });

  function updatePaginationInfo() {
    const start = table.page.info().start + 1;
    const end = table.page.info().end;
    const total = table.page.info().recordsTotal;

    $('.clients-table__range').text(`${start}-${end}`);
    $('.clients-number').text(total);

    $('.pagination-arrow.left').toggleClass('disabled', table.page() === 0);
    $('.pagination-arrow.right').toggleClass(
      'disabled',
      table.page() === table.page.info().pages - 1
    );
  }

  function formatNumber(number) {
    if (number === null || number === undefined || isNaN(number)) {
      return '';
    }
    return number.toLocaleString('en-US');
  }

  const getStateFipsCode = (stateName) => statesFips[stateName];

  const fetchPlaceInfo = async (stateName, placeName) => {
    try {
      const stateFipsCode = getStateFipsCode(stateName);
      if (!stateFipsCode) {
        console.error('State FIPS code not found!');
        return;
      }

      const apiUrl = `https://api.census.gov/data/2022/acs/acs5?get=NAME&for=place:*&in=state:${stateFipsCode}&key=8195b123f92fdf728a3247dc1c`;
      const response = await fetch(apiUrl);
      const data = await response.json();
      const placeData = data.find((item) => item[0].includes(placeName));

      if (!placeData) {
        console.error('Place not found!');
        return;
      }

      const fullPlaceName = placeData[0];
      const placeFipsCode = placeData[2];

      const detailedApiUrl = `https://api.census.gov/data/2022/acs/acs5?get=B01003_001E,B19013_001E,B25077_001E,B25024_002E&for=place:${placeFipsCode}&in=state:${stateFipsCode}&key=8195bcdd092fdf728a3247dc1c`;
      const detailedResponse = await fetch(detailedApiUrl);
      const detailedData = await detailedResponse.json();
      const [headers, values] = detailedData;

      const population = Number(values[0]);
      const medianHouseholdIncome = Number(values[1]);
      const medianHomeValue = Number(values[2]);
      const singleFamilyHomes = Number(values[3]);

      table.row
        .add([
          '',
          fullPlaceName, // City
          stateName, // State
          formatNumber(population), // Population
          '$' + formatNumber(medianHouseholdIncome), // Avg. Household Income
          formatNumber(singleFamilyHomes), // Approx. # of Single Family Homes
          '$' + formatNumber(medianHomeValue), // Avg. Home Value
          '$' + formatNumber(medianHomeValue * singleFamilyHomes), // Total Home Value
          '', // Closest Office
          '', // % of Total Pop
          '', // Cumulative Pop
          '', // Total Population
          '', // Norm. Pop
          '', // Norm. Avg. Household Income
          '', // Norm. Approx. # of Single Family Homes
          '', // Norm. Avg. Home Value
          '', // Norm. Closest Office
          '', // Weighted Score
        ])
        .draw();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  $('.submit-selection').on('click', async function () {
    table.clear().draw(); // Clear the table

    const stateRows = $('.states_wrap.included .state-row');
    let totalPopulation = 0;

    for (let i = 0; i < stateRows.length; i++) {
      const stateNameWithPlace = $(stateRows[i])
        .find('.state-name-text')
        .text()
        .trim();
      const [placeName, stateName] = stateNameWithPlace
        .split(',')
        .map((part) => part.trim());

      await fetchPlaceInfo(stateName, placeName).then(() => {
        const lastRow = table.row(':last').data();
        if (lastRow) {
          const population = parseInt(lastRow[3].replace(/,/g, ''), 10);
          totalPopulation += population || 0;
        }
      });
    }

    // Add a summary row at the beginning
    table.row.add([
      '-', // Row number
      '', // City
      '', // State
      '', // Population
      '', // Avg. Household Income
      '', // Approx. # of Single Family Homes
      '', // Avg. Home Value
      '', // Total Home Value
      '', // Closest Office
      '', // % of Total Pop
      '', // Cumulative Pop
      formatNumber(totalPopulation), // Total Population
      '', // Norm. Pop
      '', // Norm. Avg. Household Income
      '', // Norm. Approx. # of Single Family Homes
      '', // Norm. Avg. Home Value
      '', // Norm. Closest Office
      '', // Weighted Score
    ]);

    table.order([0, 'asc']).draw(); // Reorder the table
  });
});
