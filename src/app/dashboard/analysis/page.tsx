import { EPATable } from "@/components/epa-table"
import { StackedEPAChart } from "@/components/stacked-epa-chart"
// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function Page() {
  return (
    <Tabs defaultValue='graph' className="p-4 space-y-6">
      <TabsList className="mb-4">
        <TabsTrigger value="graph" aria-label="Show graph">Graph</TabsTrigger>
        <TabsTrigger value="table" aria-label="Show table">Table</TabsTrigger>
      </TabsList>

      <TabsContent value="graph">
        <StackedEPAChart />
      </TabsContent>

      <TabsContent value="table">
        <EPATable />
      </TabsContent>
    </Tabs>

  )
}