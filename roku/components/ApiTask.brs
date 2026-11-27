sub init()
    m.top.functionName = "run"
end sub

sub run()
    req = m.top.request
    baseUrl = CreateObject("roAppInfo").GetValue("server_url")
    port = CreateObject("roMessagePort")
    xfer = CreateObject("roUrlTransfer")
    xfer.SetMessagePort(port)
    xfer.SetUrl(baseUrl + req.path)
    if LCase(Left(baseUrl, 5)) = "https"
        xfer.SetCertificatesFile("common:/certs/ca-bundle.crt")
        xfer.InitClientCertificates()
    end if
    xfer.RetainBodyOnError(true)
    xfer.AddHeader("Accept", "application/json")
    xfer.AddHeader("Content-Type", "application/json")
    if req.token <> invalid and req.token <> ""
        xfer.AddHeader("Authorization", "Bearer " + req.token)
    end if

    if req.method = "GET"
        started = xfer.AsyncGetToString()
    else
        body = "{}"
        if req.body <> invalid then body = FormatJson(req.body)
        xfer.SetRequest(req.method)
        started = xfer.AsyncPostFromString(body)
    end if

    status = 0
    data = invalid
    if started
        msg = Wait(15000, port)
        if type(msg) = "roUrlEvent"
            status = msg.GetResponseCode()
            text = msg.GetString()
            if text <> "" then data = ParseJson(text)
        else
            xfer.AsyncCancel()
        end if
    end if
    m.top.response = { status: status, data: data }
end sub
