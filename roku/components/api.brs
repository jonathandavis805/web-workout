function startRequest(method as string, path as string, body as dynamic, token as dynamic, callback as string) as object
    task = CreateObject("roSGNode", "ApiTask")
    task.request = { method: method, path: path, body: body, token: token }
    if callback <> "" then task.observeField("response", callback)
    task.control = "run"
    return task
end function
