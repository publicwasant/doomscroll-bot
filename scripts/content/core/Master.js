/**
 * Master Controller v1.0.2 - Pro Logging Edition
 */
class Master {
    constructor() {
        if (Master.instance) return Master.instance;
        this.observers = new Map();
        this.instructors = new Map();
        this.database = { raw: [], stats: { success: 0, fail: 0 } };
        this.state = "IDLE";
        this.style = "color: #9b59b6; font-weight: bold; border-left: 3px solid #9b59b6; padding-left: 5px;";
        
        Master.instance = this;
        console.log("%c🧠 [MASTER] %cSystem initialized and ready.", this.style, "color: #333;");
    }

    registerObserver(name, observer) { 
        this.observers.set(name, observer); 
        console.log(`%c🧠 [MASTER] %cObserver registered: %c${name}`, this.style, "color: #555;", "color: #3498db; font-weight: bold;");
    }

    registerInstructor(name, instructor) { 
        this.instructors.set(name, instructor); 
        console.log(`%c🧠 [MASTER] %cInstructor registered: %c${name}`, this.style, "color: #555;", "color: #e67e22; font-weight: bold;");
    }

    async executeMission(mission) {
        console.group("%c🚀 [MISSION START]", "background: #9b59b6; color: white; padding: 2px 10px; border-radius: 3px;");
        console.log("%c🧠 [MASTER] %cConfiguring mission threads...", this.style, "color: #555;");
        
        this.state = "SCANNING";

        try {
            // 1. Scan
            const results = await this.broadcastToObservers(mission.targets);
            this.database.raw = results.flat();
            console.log(`%c🧠 [MASTER] %cDiscovery complete. Found %c${this.database.raw.length}%c items.`, 
                this.style, "color: #555;", "color: #3498db; font-weight: bold;", "color: #555;");

            // 2. Think
            this.state = "PROCESSING";
            const tasks = this.think(this.database.raw, mission.actions, mission.filters);
            console.log(`%c🧠 [MASTER] %cThinking phase: %c${tasks.length}%c tasks generated.`, 
                this.style, "color: #555;", "color: #9b59b6; font-weight: bold;", "color: #555;");

            // 3. Execute
            if (tasks.length > 0) {
                this.state = "EXECUTING";
                await this.broadcastToInstructors(tasks);
            } else {
                console.warn("%c🧠 [MASTER] %cNothing to do. Mission aborted.", this.style, "color: #e67e22;");
            }
        } catch (error) {
            console.error("%c🧠 [MASTER] %cMission failed with error:", this.style, "color: #e74c3c;", error);
        } finally {
            this.state = "IDLE";
            console.log("%c🧠 [MASTER] %cMission ended. Transitioning to IDLE.", this.style, "color: #7f8c8d;");
            console.groupEnd();
        }
    }

    think(data, actions, filters) {
        let tasks = [];
        const activeActions = actions && actions.length > 0 ? actions : ['PROCESS'];
        
        data.forEach(item => {
            if (item.valid) {
                activeActions.forEach(actionType => {
                    tasks.push({ action: actionType, payload: item });
                });
            }
        });
        return tasks;
    }

    async broadcastToObservers(targets) {
        const obsList = Array.from(this.observers.values());
        const jobs = obsList.map(obs => obs.onCommand(targets));
        return Promise.all(jobs);
    }

    async broadcastToInstructors(tasks) {
        const insList = Array.from(this.instructors.values());
        const jobs = insList.map(ins => ins.onCommand(tasks));
        return Promise.all(jobs);
    }

    stopAll() {
        this.state = "STOPPED";
        this.observers.forEach(obs => obs.stop());
        this.instructors.forEach(ins => ins.stop());
        console.warn("%c🛑 [MASTER] EMERGENCY STOP EXECUTED.", "background: #e74c3c; color: white; padding: 5px; font-weight: bold; width: 100%; display: block;");
    }
}
window.master = new Master();