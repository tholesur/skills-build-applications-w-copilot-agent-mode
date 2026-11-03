import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Activity input must be an object'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' ||
    !/^[0-9a-f]{24}$/i.test(userId) ||
    typeof teamId !== 'string' ||
    !/^[0-9a-f]{24}$/i.test(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes <= 0
  ) {
    throw Object.assign(new Error('Activity input is invalid'), { status: 400 });
  }

  const [userExists, teamExists] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!userExists || !teamExists) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw Object.assign(new Error('Team input must be an object'), { status: 400 });
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    !members.every((member) => typeof member === 'string' && /^[0-9a-f]{24}$/i.test(member))
  ) {
    throw Object.assign(new Error('Team input is invalid'), { status: 400 });
  }

  const uniqueMembers = [...new Set(members as string[])];
  const existingMembers = await User.countDocuments({ _id: { $in: uniqueMembers } });
  if (existingMembers !== uniqueMembers.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMembers });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const recentActivity = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const recentFocus = recentActivity?.type;
  const recentWorkouts = recentFocus ? await Workout.find({ focus: recentFocus }).lean() : [];
  const usesRecentActivity = recentWorkouts.length > 0;
  const focus = usesRecentActivity ? recentFocus : user.fitnessGoal;
  const workouts = usesRecentActivity ? recentWorkouts : await Workout.find({ focus }).lean();
  const reason = usesRecentActivity
    ? `Recommended based on your recent ${recentFocus} activity.`
    : recentActivity
      ? `Recommended for your ${user.fitnessGoal} goal and recent ${recentActivity.type} activity.`
      : `Recommended for your ${user.fitnessGoal} goal.`;

  return workouts.map((workout) => ({ ...workout, reason }));
}

export { User };
