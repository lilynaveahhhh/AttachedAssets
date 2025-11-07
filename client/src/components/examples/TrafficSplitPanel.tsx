import TrafficSplitPanel from '../TrafficSplitPanel';

export default function TrafficSplitPanelExample() {
  return (
    <div className="p-4 max-w-md">
      <TrafficSplitPanel
        blueTraffic={100}
        onApplyTraffic={(percentage) => console.log('Apply traffic split:', percentage)}
      />
    </div>
  );
}
