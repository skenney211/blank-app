import dash
from dash import dcc, html, dash_table
from dash.dependencies import Input, Output
import plotly.express as px
import pandas as pd
import requests

app = dash.Dash(__name__)
app.title = "Japan Earthquakes"

DATA_URL = "https://www.jma.go.jp/bosai/quake/data/list.json"


def fetch_quakes(limit: int = 50) -> pd.DataFrame:
    """Return recent Japan earthquake records."""
    try:
        resp = requests.get(DATA_URL, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        records = []
        for item in data[:limit]:
            hypo = item.get("hypo") or {}
            lat, lon = hypo.get("lat"), hypo.get("lon")
            if lat is not None and lon is not None:
                records.append({
                    "time": item.get("time"),
                    "lat": lat,
                    "lon": lon,
                    "mag": item.get("mag"),
                    "depth": hypo.get("depth"),
                })
        return pd.DataFrame(records)
    except requests.RequestException as exc:
        print("Error fetching JMA data:", exc)
        return pd.DataFrame(columns=["time", "lat", "lon", "mag", "depth"])

def build_table(data: pd.DataFrame) -> dash_table.DataTable:
    return dash_table.DataTable(
        id="quake-table",
        columns=[{"name": col.capitalize(), "id": col} for col in data.columns],
        data=data.to_dict("records"),
        page_size=10,
        style_table={"overflowX": "auto"},
    )


app.layout = html.Div(
    [
        html.H1("Japan Seismic Activity (Live Dashboard)"),
        dcc.Graph(id="live-map"),
        html.H2("Recent Earthquake Events (Last 50)"),
        html.Div(id="table-container"),
        dcc.Interval(id="interval-component", interval=60000, n_intervals=0),
    ],
    style={"padding": "20px"},
)


@app.callback(
    Output("live-map", "figure"),
    Output("table-container", "children"),
    Input("interval-component", "n_intervals"),
)
def update_dashboard(_):
    df = fetch_quakes()
    fig = px.scatter_mapbox(
        df,
        lat="lat",
        lon="lon",
        size="mag",
        color="depth",
        color_continuous_scale="Viridis",
        zoom=4,
        height=500,
        hover_name="mag",
        hover_data=["time", "depth"],
    )
    fig.update_layout(
        mapbox_style="open-street-map",
        margin={"r": 0, "t": 0, "l": 0, "b": 0},
    )
    return fig, build_table(df)


if __name__ == "__main__":
    # dash>=3 uses `app.run` as the preferred method
    app.run(debug=False)
