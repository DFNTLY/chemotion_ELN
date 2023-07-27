const styles = {
  amazingBtn: {
    borderRadius: '8px',
    boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
    width: '35px',
    height: '35px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    color: '#FFFFFF'
  },
  container: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '15px 0'
  },
  svgContainer: { display: 'flex', position: 'relative' },
  legendContainer: { display: 'flex', justifyContent: 'center', marginTop: '15px' },
  legendItem: { display: 'flex', alignItems: 'center', marginRight: '20px' },
  legendMarker: {
    width: '18px', height: '18px', marginRight: '8px', borderRadius: '50%'
  },
  legendText: { margin: '0', fontSize: '1.2em', color: '#333' },
  panel: {
    borderWidth: '0px',
    backgroundColor: '#F0F2F5',
    padding: '5px',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  panelItem: {
    borderWidth: '0px',
    backgroundColor: '#FAFAFA',
    padding: '5px',
    borderRadius: '8px',
    boxShadow: '0px 2px 10px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    marginTop: '5px',
  },
  panelItemContent: {
    fontWeight: 'Bold', width: '100%', display: 'flex', justifyContent: 'space-between', padding: '10px 20px'
  }
};
export default styles;
