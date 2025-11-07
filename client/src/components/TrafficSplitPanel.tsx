import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface TrafficSplitPanelProps {
  blueTraffic: number;
  onApplyTraffic?: (bluePercentage: number) => void;
}

export default function TrafficSplitPanel({ blueTraffic: initialBlue, onApplyTraffic }: TrafficSplitPanelProps) {
  const [blueTraffic, setBlueTraffic] = useState(initialBlue);
  const greenTraffic = 100 - blueTraffic;

  const handleApply = () => {
    if (onApplyTraffic) {
      onApplyTraffic(blueTraffic);
    }
  };

  return (
    <Card data-testid="card-traffic-split">
      <CardHeader>
        <CardTitle className="text-lg">Traffic Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-1" />
              <span className="text-sm font-medium">Blue Environment</span>
            </div>
            <Badge variant="secondary" data-testid="badge-blue-traffic">{blueTraffic}%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-2" />
              <span className="text-sm font-medium">Green Environment</span>
            </div>
            <Badge variant="secondary" data-testid="badge-green-traffic">{greenTraffic}%</Badge>
          </div>
        </div>

        <div className="space-y-2">
          <Slider
            value={[blueTraffic]}
            onValueChange={(value) => setBlueTraffic(value[0])}
            max={100}
            step={5}
            className="w-full"
            data-testid="slider-traffic"
          />
          <div className="h-4 bg-muted rounded-full overflow-hidden flex">
            <div
              className="bg-chart-1 transition-all"
              style={{ width: `${blueTraffic}%` }}
            />
            <div
              className="bg-chart-2 transition-all"
              style={{ width: `${greenTraffic}%` }}
            />
          </div>
        </div>

        <Button
          className="w-full"
          onClick={handleApply}
          disabled={blueTraffic === initialBlue}
          data-testid="button-apply-traffic"
        >
          Apply Traffic Split
        </Button>
      </CardContent>
    </Card>
  );
}
