# Test Conversation Memory System
# This script tests the conversation memory functionality

Write-Host "`nTesting Conversation Memory System" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Gray

$baseUrl = "http://localhost:3000"

# Test 1: Create a new conversation session
Write-Host "`nTest 1: Creating new conversation session..." -ForegroundColor Yellow

try {
    $createResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/conversation/create" `
        -Method POST `
        -ContentType "application/json"
    
    if ($createResponse.success) {
        $sessionId = $createResponse.sessionId
        Write-Host "Session created: $sessionId" -ForegroundColor Green
        Write-Host "Created at: $($createResponse.createdAt)" -ForegroundColor Gray
    } else {
        Write-Host "Failed to create session: $($createResponse.error)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error creating session: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Ask first question
Write-Host "`nTest 2: Asking first question..." -ForegroundColor Yellow
$question1 = "What programming languages do you know?"

try {
    $query1Body = @{
        question = $question1
        sessionId = $sessionId
        enableCache = $true
    } | ConvertTo-Json

    $query1Response = Invoke-RestMethod `
        -Uri "$baseUrl/api/conversation/query" `
        -Method POST `
        -ContentType "application/json" `
        -Body $query1Body
    
    if ($query1Response.success) {
        Write-Host "Question 1 successful" -ForegroundColor Green
        Write-Host "Q: $question1" -ForegroundColor Cyan
        Write-Host "A: $($query1Response.response.Substring(0, [Math]::Min(150, $query1Response.response.Length)))..." -ForegroundColor White
        Write-Host "Turns in conversation: $($query1Response.conversationHistory.Count)" -ForegroundColor Gray
    } else {
        Write-Host "Question 1 failed: $($query1Response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error on question 1: $_" -ForegroundColor Red
}

# Wait a moment
Start-Sleep -Seconds 2

# Test 3: Ask follow-up question (tests memory)
Write-Host "`nTest 3: Asking follow-up question (testing memory)..." -ForegroundColor Yellow
$question2 = "Which one is your favorite and why?"

try {
    $query2Body = @{
        question = $question2
        sessionId = $sessionId
        enableCache = $true
    } | ConvertTo-Json

    $query2Response = Invoke-RestMethod `
        -Uri "$baseUrl/api/conversation/query" `
        -Method POST `
        -ContentType "application/json" `
        -Body $query2Body
    
    if ($query2Response.success) {
        Write-Host "Question 2 successful (follow-up)" -ForegroundColor Green
        Write-Host "Q: $question2" -ForegroundColor Cyan
        Write-Host "A: $($query2Response.response.Substring(0, [Math]::Min(150, $query2Response.response.Length)))..." -ForegroundColor White
        Write-Host "Turns in conversation: $($query2Response.conversationHistory.Count)" -ForegroundColor Gray
        Write-Host "Cache hit: $($query2Response.cacheHit)" -ForegroundColor Gray
    } else {
        Write-Host "Question 2 failed: $($query2Response.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error on question 2: $_" -ForegroundColor Red
}

# Test 4: Get conversation history
Write-Host "`nTest 4: Getting conversation history..." -ForegroundColor Yellow

try {
    $historyResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/conversation/$sessionId" `
        -Method GET
    
    if ($historyResponse.success) {
        Write-Host "History retrieved successfully" -ForegroundColor Green
        Write-Host "Session ID: $($historyResponse.sessionId)" -ForegroundColor Gray
        Write-Host "Total turns: $($historyResponse.history.Count)" -ForegroundColor Gray
        
        if ($historyResponse.stats) {
            Write-Host "`nSession stats:" -ForegroundColor Cyan
            Write-Host "  Turn count: $($historyResponse.stats.turnCount)" -ForegroundColor White
            Write-Host "  Session age: $([Math]::Floor($historyResponse.stats.sessionAge / 1000))s" -ForegroundColor White
            Write-Host "  Last active: $([Math]::Floor($historyResponse.stats.lastActive / 1000))s ago" -ForegroundColor White
        }
        
        Write-Host "`nConversation:" -ForegroundColor Cyan
        foreach ($turn in $historyResponse.history) {
            $role = $turn.role.ToUpper()
            $preview = $turn.content.Substring(0, [Math]::Min(80, $turn.content.Length))
            Write-Host "  $role : $preview..." -ForegroundColor White
        }
    } else {
        Write-Host "Failed to get history: $($historyResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error getting history: $_" -ForegroundColor Red
}

# Test 5: Clear conversation
Write-Host "`nTest 5: Clearing conversation..." -ForegroundColor Yellow

try {
    $clearResponse = Invoke-RestMethod `
        -Uri "$baseUrl/api/conversation/clear/$sessionId" `
        -Method DELETE
    
    if ($clearResponse.success) {
        Write-Host "Conversation cleared: $($clearResponse.message)" -ForegroundColor Green
    } else {
        Write-Host "Failed to clear: $($clearResponse.error)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error clearing conversation: $_" -ForegroundColor Red
}

Write-Host "`n"
Write-Host ("=" * 60) -ForegroundColor Gray
Write-Host "Conversation memory tests completed!" -ForegroundColor Green
Write-Host ""
