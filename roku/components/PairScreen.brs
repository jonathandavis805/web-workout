sub init()
    m.code = m.top.findNode("code")
    m.status = m.top.findNode("status")
    m.pollTimer = m.top.findNode("pollTimer")
    m.pollTimer.observeField("fire", "pollStatus")
    m.retryTimer = m.top.findNode("retryTimer")
    m.retryTimer.observeField("fire", "startPairing")
    webUrl = CreateObject("roAppInfo").GetValue("web_url")
    m.top.findNode("instructions").text = "On your phone or computer, go to " + webUrl + "/tv and enter this code:"
    startPairing()
end sub

sub startPairing()
    m.pollTimer.control = "stop"
    m.status.text = "Getting a code..."
    name = CreateObject("roDeviceInfo").GetFriendlyName()
    m.startTask = startRequest("POST", "/api/tv/pair/start", { name: name }, invalid, "onPairStarted")
end sub

sub onPairStarted(event as object)
    response = event.getData()
    if response.status <> 201
        m.code.text = "--- ---"
        m.status.text = "Can't reach Gruuve. Trying again..."
        m.retryTimer.control = "start"
        return
    end if
    m.pendingToken = response.data.token
    m.code.text = Left(response.data.code, 3) + " " + Right(response.data.code, 3)
    m.status.text = "Waiting for you to enter the code..."
    m.pollTimer.control = "start"
end sub

sub pollStatus()
    if m.statusTask <> invalid and m.statusTask.state = "run" then return
    m.statusTask = startRequest("GET", "/api/tv/pair/status", invalid, m.pendingToken, "onPairStatus")
end sub

sub onPairStatus(event as object)
    response = event.getData()
    if response.status = 401
        startPairing()
    else if response.status = 200 and response.data <> invalid
        if response.data.paired
            m.pollTimer.control = "stop"
            m.top.token = m.pendingToken
        else if response.data.expired
            startPairing()
        end if
    end if
end sub
