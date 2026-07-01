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
      <div className="flex h-[350px] items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        Loading Report...
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">

      {/* Header */}

      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">

        <div>

          <h2 className="text-lg font-semibold">
            Report Result
          </h2>

          <p className="text-sm text-gray-500">
            {data.length} record{data.length !== 1 ? "s" : ""} found
          </p>

        </div>

        {data.length > 0 && (
          <div className="flex gap-2">

            <Button
              size="small"
              icon={<FileExcelOutlined />}
            >
              Excel
            </Button>

            <Button
              size="small"
              icon={<FilePdfOutlined />}
            >
              PDF
            </Button>

          </div>
        )}

      </div>

      {/* Content */}

      <div className="flex-1 overflow-auto">

        {data.length === 0 ? (

          <div className="flex h-full items-center justify-center">

            <Empty description="No Report Generated" />

          </div>

        ) : (

          <div className="min-w-[1000px]">

            <Table>

              <TableHeader>

                <TableRow>

                  {columns.map((column) => (

                    <TableCell
                      key={column.key}
                      isHeader
                      className="px-5 py-3 font-semibold"
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
                        className="px-5 py-3"
                      >
                        {row[column.key] ?? "-"}
                      </TableCell>

                    ))}

                  </TableRow>

                ))}

              </TableBody>

            </Table>

          </div>

        )}

      </div>

    </div>
  );
}