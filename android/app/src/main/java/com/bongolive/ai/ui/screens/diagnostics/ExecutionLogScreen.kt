package com.bongolive.ai.ui.screens.diagnostics

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.DeleteSweep
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bongolive.ai.data.local.dao.ExecutionLogDao
import com.bongolive.ai.data.local.entity.ExecutionLogEntity
import com.bongolive.ai.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExecutionLogScreen(
    executionLogDao: ExecutionLogDao,
    onBack: () -> Unit
) {
    val logs by executionLogDao.getAllLogsFlow().collectAsState(initial = emptyList())
    val scope = rememberCoroutineScope()
    val dateFormat = remember { SimpleDateFormat("HH:mm:ss", Locale.getDefault()) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(text = "অটোমেশন এক্সিকিউশন লগ", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(text = "Goal → Decision → Observation → Action → Result", fontSize = 11.sp, color = TextSecondary)
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                actions = {
                    IconButton(onClick = { scope.launch { executionLogDao.clearAllLogs() } }) {
                        Icon(imageVector = Icons.Default.DeleteSweep, contentDescription = "Clear", tint = TextTertiary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = SurfaceDark)
            )
        },
        containerColor = BackgroundDark
    ) { padding ->
        if (logs.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "এখনো কোনো এক্সিকিউশন লগ রেকর্ড করা হয়নি।", color = TextSecondary, fontSize = 13.sp)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(vertical = 12.dp)
            ) {
                items(logs, key = { it.id }) { logItem ->
                    LogCard(item = logItem, timeStr = dateFormat.format(Date(logItem.timestamp)))
                }
            }
        }
    }
}

@Composable
fun LogCard(item: ExecutionLogEntity, timeStr: String) {
    val badgeColor = when (item.status) {
        "SUCCESS" -> Emerald400
        "FAILURE" -> Red400
        "RETRY" -> Amber400
        "PAUSED" -> Cyan400
        else -> Blue400
    }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = SurfaceDark,
        border = androidx.compose.foundation.BorderStroke(1.dp, SurfaceBorder)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = badgeColor.copy(alpha = 0.2f)
                    ) {
                        Text(
                            text = item.stage,
                            color = badgeColor,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(text = item.status, color = TextSecondary, fontSize = 10.sp)
                }
                Text(text = timeStr, color = TextTertiary, fontSize = 10.sp)
            }
            Spacer(modifier = Modifier.height(6.dp))
            Text(text = item.description, color = TextPrimary, fontSize = 12.sp, lineHeight = 16.sp)
        }
    }
}
