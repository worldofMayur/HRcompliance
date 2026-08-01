import React from "react";
import ReactApexChart from "react-apexcharts";

interface Props {
  data: Record<string, number>;
}

export default function CompliancePieChart({ data }: Props) {
  const labels = [
    "CC Issued",
    "Exceptional CC",
    "Under Audit",
    "Document Not Submitted",
  ];

  const colors = [
    "#1677ff",
    "#722ed1",
    "#fa8c16",
    "#f5222d",
  ];

  const values = [
    data.ccIssued ?? 0,
    data.exceptionalCC ?? 0,
    data.underAudit ?? 0,
    data.documentNotSubmitted ?? 0,
  ];

  const total = values.reduce((a, b) => a + b, 0);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      height: 420,
      toolbar: {
        show: false,
      },
    },

    labels,

    colors,

    states: {
      hover: {
        filter: {
          type: "lighten",
          value: 0.12,
        },
      },
      active: {
        filter: {
          type: "none",
        },
      },
    },

    stroke: {
      width: 5,
      colors: ["#ffffff"],
    },

    plotOptions: {
      pie: {
        expandOnClick: true,

        donut: {
          size: "72%",

          labels: {
            show: true,

            name: {
              show: true,
              offsetY: -12,
              fontSize: "18px",
              fontWeight: 600,
              color: "#666",
            },

            value: {
              show: true,
              offsetY: 12,
              fontSize: "34px",
              fontWeight: 700,
              color: "#111",
            },

            total: {
              show: true,
              showAlways: true,
              label: "Total",

              fontSize: "18px",
              fontWeight: 500,
              color: "#666",

              formatter: () => `${total}`,
            },
          },
        },
      },
    },

    legend: {
      position: "bottom",

      fontSize: "14px",
      fontWeight: 600,

      itemMargin: {
        horizontal: 15,
        vertical: 10,
      },

      markers: {
        width: 12,
        height: 12,
        radius: 12,
      },
    },

    dataLabels: {
      enabled: true,

      formatter(val: number) {
        if (val < 5) return "";
        return `${val.toFixed(1)}%`;
      },

      offset: 4,

      style: {
        fontSize: "18px",
        fontWeight: "700",
        colors: ["#ffffff"],
      },

      dropShadow: {
        enabled: false,
      },
    },

    tooltip: {
      fillSeriesColor: false,

      custom: ({ series, seriesIndex, w }) => {
        return `
          <div
            style="
              background:#1f1f1f;
              color:#fff;
              border-radius:12px;
              padding:12px 16px;
              font-family:Inter,sans-serif;
              min-width:180px;
              box-shadow:0 8px 24px rgba(0,0,0,.25);
            "
          >
            <div
              style="
                display:flex;
                align-items:center;
                gap:10px;
                font-size:15px;
                font-weight:600;
              "
            >
              <span
                style="
                  width:12px;
                  height:12px;
                  border-radius:50%;
                  background:${colors[seriesIndex]};
                  display:inline-block;
                "
              ></span>

              <span>${w.globals.labels[seriesIndex]}</span>
            </div>

            <div
              style="
                margin-top:8px;
                font-size:18px;
                font-weight:700;
                padding-left:22px;
              "
            >
              ${series[seriesIndex]} Vendors
            </div>
          </div>
        `;
      },
    },

    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 340,
          },

          legend: {
            fontSize: "12px",
          },
        },
      },
    ],
  };

  return (
    <ReactApexChart
      options={options}
      series={values}
      type="donut"
      height={420}
    />
  );
}