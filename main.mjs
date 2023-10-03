import express from "express"
import axios from "axios"
import cors from "cors"

const ENDPOINT = process.env.PROMETHEUS_ENDPOINT || "http://192.168.10.238:8428"

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
    "neos_registered_users",
    "neos_online_users{device=\"vr\"}",
    "neos_online_users{device=\"headless\"}",
    "neos_online_users{device=\"screen\"}",
    "neos_online_users{device=\"mobile\"}"
]

const labelMap = {
    "neos_registered_users": "neos_registeredUserCount",
    "neos_online_users{device=\"vr\"}" : "neos_vrUserCount",
    "neos_online_users{device=\"headless\"}": "neos_headlessUserCount",
    "neos_online_users{device=\"screen\"}": "neos_screenUserCount",
    "neos_online_users{device=\"mobile\"}": "neos_mobileUserCount"
}
app.get("/v1/neos/usercount", async (req, res) => {
    let tmpObj = {}
    for (const qn of label_list) {
        tmpObj[labelMap[qn]] = await prometheus_query(qn)
    }
    res.json(tmpObj)
})

const resonite_label_list = [
    "resonite_registered_users",
    "resonite_users{type=\"VR\"}",
    "resonite_users{type=\"Screen\"}",
    "resonite_users{type=\"Mobile\"}",
    "resonite_users_by_client_type{type=\"Headless\"}",
]

const resonite_labelMap = {
    "resonite_registered_users": "resonite_all",
    "resonite_users{type=\"VR\"}" : "resonite_vr",
    "resonite_users{type=\"Screen\"}": "resonite_screen",
    "resonite_users{type=\"Mobile\"}": "resonite_mobile",
    "resonite_users_by_client_type{type=\"Headless\"}": "resonite_headless"
}

app.get("/v1/resonite/usercount", async (req, res) => {
    let tmpObj = {}
    for (const qn of resonite_label_list) {
        tmpObj[resonite_labelMap[qn]] = await prometheus_query(qn)
    }
    res.json(tmpObj)
})

app.get("/v1/neos/usercount/1d", async (req, res) => {
    let tmpObj = {}
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 1)

    for (const qn of label_list) {
        tmpObj[labelMap[qn]] = await prometheus_query_range(qn,start.toISOString(), end.toISOString(), "6m" )
    }
    res.json(tmpObj)
})