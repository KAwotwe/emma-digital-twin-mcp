# Interactive Voice Digital Twin
# Ask questions and hear Emmanuel's Digital Twin respond with voice

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  🎤 EMMANUEL'S VOICE-ENABLED DIGITAL TWIN  " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ask Emmanuel's Digital Twin anything about his professional background!" -ForegroundColor Yellow
Write-Host "The response will be spoken aloud using ElevenLabs voice synthesis." -ForegroundColor Gray
Write-Host ""

# Get question from user
$question = Read-Host "Your Question"

if ([string]::IsNullOrWhiteSpace($question)) {
    Write-Host ""
    Write-Host "❌ No question provided. Exiting..." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "🤔 Processing your question..." -ForegroundColor Yellow
Write-Host "Question: $question" -ForegroundColor Cyan
Write-Host ""

# Step 1: Query the Digital Twin RAG system
Write-Host "📚 Querying Digital Twin knowledge base..." -ForegroundColor Yellow

$ragBody = @{
    question = $question
    interviewType = "auto"
} | ConvertTo-Json

try {
    $ragResponse = Invoke-RestMethod -Uri "https://emma-digital-twin-mcp.vercel.app/api/test-mcp-tool" -Method Post -Body $ragBody -ContentType "application/json"
    
    $answer = $ragResponse.response
    
    if ([string]::IsNullOrWhiteSpace($answer)) {
        Write-Host "❌ No response received from Digital Twin" -ForegroundColor Red
        exit
    }
    
    Write-Host "✅ Answer generated!" -ForegroundColor Green
    Write-Host ""
    
    # Display the text answer
    Write-Host "================================================================" -ForegroundColor Blue
    Write-Host "📝 Text Response:" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Blue
    Write-Host $answer -ForegroundColor White
    Write-Host "================================================================" -ForegroundColor Blue
    Write-Host ""
    
    # Step 2: Convert to speech
    Write-Host "🔊 Converting answer to speech..." -ForegroundColor Yellow
    
    $ttsBody = @{ text = $answer } | ConvertTo-Json
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $filename = "voice_response_$timestamp.mp3"
    
    Invoke-WebRequest -Uri "https://emma-digital-twin-mcp.vercel.app/api/voice/speak" -Method Post -Body $ttsBody -ContentType "application/json" -OutFile $filename
    
    if (Test-Path $filename) {
        $fileSize = (Get-Item $filename).Length
        $fileSizeKB = [math]::Round($fileSize / 1024, 2)
        
        Write-Host "✅ Audio generated: $filename ($fileSizeKB KB)" -ForegroundColor Green
        Write-Host ""
        Write-Host "🎧 Playing Emmanuel's response..." -ForegroundColor Cyan
        Write-Host ""
        
        # Play the audio
        Start-Process $filename
        
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host "✅ Voice response is now playing!" -ForegroundColor Green
        Write-Host "📁 Audio saved to: $filename" -ForegroundColor Gray
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host "❌ Failed to generate audio file" -ForegroundColor Red
    }
    
} catch {
    Write-Host ""
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
