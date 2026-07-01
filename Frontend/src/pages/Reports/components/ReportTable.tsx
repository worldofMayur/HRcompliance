import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

import { Empty, Button } from "antd";
import {
  FileExcelOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";

interface Column {
  title: string;
  key: string;
}

interface Props {
  columns: Column[];
  data: any[];
  loading?: boolean;
}

export default function ReportTable({
  columns,
  data,
  loading = false,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        Loading Report...
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">

      {/* Header */}

      <div className="flex items-center justify-between border-b px-5 py-4">

        <div>

          <h2 className="text-lg font-semibold">
            Report Result
          </h2>

          <p className="text-sm text-gray-500">
            Generated report will appear below.
          </p>

        </div>

        {data.length > 0 && (
          <div className="flex gap-3">

            <Button icon={<FileExcelOutlined />}>
              Excel
            </Button>

            <Button icon={<FilePdfOutlined />}>
              PDF
            </Button>

          </div>
        )}

      </div>

      {data.length === 0 ? (

        <div className="p-8">

          <Empty description="No Report Generated" />

        </div>

      ) : (

      <div className="overflow-x-auto">

        <div className="min-w-[900px]">

          <Table>

            <TableHeader>

              <TableRow>

                {columns.map((column) => (

                  <TableCell
                    key={column.key}
                    isHeader
                    className="px-5 py-3"
                  >
                    {column.title}
                  </TableCell>

                ))}

              </TableRow>

            </TableHeader>

            <TableBody>

              {data.map((row, index) => (

                <TableRow key={index}>

                  {columns.map((column) => (

                    <TableCell
                      key={column.key}
                      className="px-5 py-4"
                    >
                      {row[column.key] ?? "-"}
                    </TableCell>

                  ))}

                </TableRow>

              ))}

            </TableBody>

          </Table>

        </div>

      </div>

      )}

    </div>
  );
}