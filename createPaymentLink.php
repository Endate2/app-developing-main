<?php
$data = json_decode(file_get_contents('php://input'), true);
$amount = $data['amount'] ?? 0;
$userId = $data['userId'] ?? '';
$orderNumber = $data['orderNumber'] ?? '';

// Вызов функции
$paymentUrl = tinkoff_getLink($amount, $userId, $orderNumber);

if ($paymentUrl) {
    echo json_encode(['paymentUrl' => $paymentUrl]);
} else {
    echo json_encode(['error' => 'Невозможно создать ссылку']);
}
function tinkoff_getLink($amount, $chatId, $orderNumber) {

    $link = false;

    // Amount нужно передать в копейках, целое число
    // OrderId должен быть уникальным
    $data = [
        "Amount"      => $amount*100,
        "Description" => 'Оплата рекламы для канала"',
        "OrderId"     => "$chatId-n$orderNumber",
        "TerminalKey" => TINKOFF_TERMINAL_KEY,
        "Password"    => TINKOFF_TERMINAL_PASSWORD
    ];

    ksort($data);
    
    // Получаем все значения из массива
    $values = array_values($data);

    // Конкатенируем все значения в одну строку
    $concatenatedString = implode('', $values);

    // Хэшируем
    $hashedString = hash('sha256', $concatenatedString);

    $data['Token'] = $hashedString;
    unset($data['Password']);
    
    $postDataJson = json_encode($data);

    
    // Настройки cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, TINKOFF_INIT_URL);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postDataJson);

    // Добавляем заголовки для указания того, что тело запроса содержит JSON
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($postDataJson)
    ]);

    // Выполнение запроса и получение ответа
    $output = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($output === false || $httpCode !== 200) {
        error_log('Не удалось выполнить запрос, HTTP код: ' . $httpCode);
        return false;
    }
    $outputArray = json_decode($output, true); // true означает декодирование в массив
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('Ошибка при декодировании JSON: ' . json_last_error_msg());
        return false;
    }

    if (isset($outputArray['Success']) && $outputArray['Success'] === true 
        && isset($outputArray['PaymentURL'])) {

        return $outputArray['PaymentURL'];
    } else {
        error_log("Ссылка не пришла");
        return false;
    }
}