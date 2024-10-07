if (typeof window !== 'undefined' && !window.ipcRenderer) {
  window.ipcRenderer = require('electron').ipcRenderer;
}

document.addEventListener('DOMContentLoaded', () => {
  const dashboard = new Dashboard();
  dashboard.init();
});

class Dashboard {
  constructor() {
      this.assetChart = null;
  }

  async init() {
      await this.updateDashboard();
      // Set up event listeners for real-time updates
      window.ipcRenderer.on('assetUpdated', () => this.updateDashboard());
  }

  async updateDashboard() {
      await this.updateAssetCounts();
      await this.updateAssetChart();
  }

  async updateAssetCounts() {
      const assetCounts = await window.ipcRenderer.invoke('getAssetCountsByStation');

      // Compute total asset count across all stations
      const totalFurniture = assetCounts.furniture.reduce((sum, item) => sum + parseInt(item.count, 10), 0);
      const totalVehicles = assetCounts.vehicle.reduce((sum, item) => sum + parseInt(item.count, 10), 0);
      const totalOfficeEquipment = assetCounts.office_equipment.reduce((sum, item) => sum + parseInt(item.count, 10), 0);
      const totalOther = assetCounts.other.reduce((sum, item) => sum + parseInt(item.count, 10), 0);

      const totalAssets = totalFurniture + totalVehicles + totalOfficeEquipment + totalOther;

      const assetCountsContainer = document.getElementById('assetCountsContainer');
      assetCountsContainer.innerHTML = `
          <div class="circle total-assets-count">Total Assets: ${totalAssets}</div>
          <div class="circle furniture-count">Furniture: ${totalFurniture}</div>
          <div class="circle vehicle-count">Vehicles: ${totalVehicles}</div>
          <div class="circle office-equipment-count">Office Equipment: ${totalOfficeEquipment}</div>
          <div class="circle other-count">Other Assets: ${totalOther}</div>
      `;
  }

  async updateAssetChart() {
      try {
          const assetCountsByStation = await window.ipcRenderer.invoke('getAssetCountsByStation');

          // Get all unique stations across asset types
          const stations = [...new Set([
              ...assetCountsByStation.furniture.map(item => item.station_name),
              ...assetCountsByStation.vehicle.map(item => item.station_name),
              ...assetCountsByStation.office_equipment.map(item => item.station_name),
              ...assetCountsByStation.other.map(item => item.station_name)
          ])];

          const datasets = [
              {
                  label: 'Furniture',
                  backgroundColor: '#D1495B',
                  data: stations.map(station => assetCountsByStation.furniture.find(item => item.station_name === station)?.count || 0)
              },
              {
                  label: 'Vehicles',
                  backgroundColor: '#30638E',
                  data: stations.map(station => assetCountsByStation.vehicle.find(item => item.station_name === station)?.count || 0)
              },
              {
                  label: 'Office Equipment',
                  backgroundColor: '#EDAE49',
                  data: stations.map(station => assetCountsByStation.office_equipment.find(item => item.station_name === station)?.count || 0)
              },
              {
                  label: 'Other Assets',
                  backgroundColor: '#00798C',
                  data: stations.map(station => assetCountsByStation.other.find(item => item.station_name === station)?.count || 0)
              }
          ];

          const chartElement = document.getElementById('assetChart');
          if (!chartElement) {
              console.error('Chart element not found');
              return;
          }

          if (this.assetChart) {
              this.assetChart.data.labels = stations;
              this.assetChart.data.datasets = datasets;
              this.assetChart.update();
          } else {
              this.assetChart = new Chart(chartElement, {
                  type: 'bar',
                  data: {
                      labels: stations,
                      datasets: datasets
                  },
                  options: {
                      scales: {
                          x: { stacked: true },
                          y: { stacked: true }
                      },
                      responsive: true,
                      maintainAspectRatio: false
                  }
              });
          }
      } catch (error) {
          console.error('Error in updateAssetChart:', error);
      }
  }
}
