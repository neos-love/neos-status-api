import express from "express"
import axios from "axios"
import cors from "cors"

const ENDPOINT = process.env.PROMETHEUS_ENDPOINT || "http://192.168.10.238:9090"

const app = express()
app.use(cors())
app.listen(3000, () => console.log("ok 3000"))

const prometheus_query = async (qn) => {
    const {data} = await axios.get(ENDPOINT + "/api/v1/query?query=" + qn)
    if(data.status === "success") {
        return Number(data.data.result[0].value[1])
    }
    return 0
}

const prometheus_query_range = async (qn, start, end, step) => {
    const {data} = await axios.get(`${ENDPOINT}/api/v1/query_range?query=${qn}&start=${start}&end=${end}&step=${step}`)
    if(data.status === "success") {
        return data.data.result[0].values
    }
    return []
}

const label_list = [
    "neos_registeredUserCount",
    "neos_vrUserCount",
    "neos_headlessUserCount",
    "neos_screenUserCount",
    "neos_mobileUserCount"
]
app.get("/v1/neos/usercount", async (req, res) => {
    let tmpObj = {}
    for (const qn of label_list) {
        tmpObj[qn] = await prometheus_query(qn)
    }
    res.json(tmpObj)
})

app.get("/v1/neos/usercount/1d", async (req, res) => {
    let tmpObj = {}
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 1)

    for (const qn of label_list) {
        tmpObj[qn] = await prometheus_query_range(qn,start.toISOString(), end.toISOString(), "6m" )
    }
    res.json(tmpObj)
})